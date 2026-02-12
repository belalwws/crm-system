import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
import { AuthRequest } from '../types';
import prisma, { withRetry } from '../lib/prisma';
import logger from '../lib/logger';

/**
 * Authentication Middleware v3.0
 * - Clerk tokens: cryptographically verified via @clerk/backend verifyToken()
 * - Local tokens: verified with JWT_SECRET (HS256)
 * - Auto-creates user from Clerk if not found
 * - Attaches role to request for RBAC
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
      return;
    }

    // Peek at the token to determine type (Clerk vs local)
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded || !decoded.payload) {
      res.status(401).json({ success: false, message: 'Invalid token format' });
      return;
    }

    const payload = decoded.payload;
    const isClerkToken = payload.sub && (payload.azp || payload.iss?.includes('clerk'));

    if (isClerkToken) {
      // ===== Clerk token: cryptographic verification =====
      try {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
          logger.error('CLERK_SECRET_KEY not configured');
          res.status(500).json({ success: false, message: 'Server configuration error' });
          return;
        }

        // Cryptographically verify the JWT signature using Clerk's JWKS
        const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES
          ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map(s => s.trim())
          : undefined;
        const verifiedPayload = await verifyToken(token, {
          secretKey: clerkSecretKey,
          ...(authorizedParties ? { authorizedParties } : {}),
        });

        const clerkUserId = verifiedPayload.sub;
        const email = (verifiedPayload as any).email ||
          (verifiedPayload as any).primary_email_address ||
          ((verifiedPayload as any).email_addresses && (verifiedPayload as any).email_addresses[0]) ||
          `${clerkUserId}@clerk.user`;

        let user = await withRetry(() => prisma.user.findFirst({
          where: {
            OR: [
              { id: clerkUserId },
              { email: email },
            ],
          },
          select: { id: true, email: true, role: true, isActive: true, name: true },
        }));

        if (!user) {
          // Store a bcrypt hash of a random value — never plaintext.
          // The sentinel prefix 'CLERK_SSO:' makes it obvious this is not a real password.
          const bcryptLib = await import('bcryptjs');
          const randomBytes = (await import('crypto')).randomBytes(64).toString('base64');
          const hashedPlaceholder = await bcryptLib.hash(`CLERK_SSO:${randomBytes}`, 12);
          user = await withRetry(() => prisma.user.create({
            data: {
              id: clerkUserId,
              email: email,
              name: (verifiedPayload as any).name || (verifiedPayload as any).first_name || (verifiedPayload as any).username || 'User',
              password: hashedPlaceholder,
            },
            select: { id: true, email: true, role: true, isActive: true, name: true },
          }));
        }

        if (!user.isActive) {
          res.status(403).json({ success: false, message: 'Account is deactivated' });
          return;
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        };
        next();
        return;
      } catch (clerkError) {
        logger.warn('Clerk token verification failed:', clerkError);
        res.status(401).json({ success: false, message: 'Invalid or expired Clerk token' });
        return;
      }
    }

    // ===== Local tokens: verify with JWT_SECRET (HS256) =====
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ success: false, message: 'Server configuration error' });
      return;
    }

    try {
      const verified = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
      }) as { id: string; email: string };

      const user = await withRetry(() => prisma.user.findUnique({
        where: { id: verified.id },
        select: { id: true, email: true, role: true, isActive: true, name: true },
      }));

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated' });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
      next();
      return;
    } catch {
      // Token verification failed
    }

    res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  } catch (error) {
    logger.error('Server auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};
