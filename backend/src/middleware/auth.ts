import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import prisma, { withRetry } from '../lib/prisma';
import logger from '../lib/logger';

/**
 * Authentication Middleware v2.0
 * - Clerk tokens: verified with strict claim checks (sub, exp, iat)
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

    try {
      // Decode to determine token type
      const decoded = jwt.decode(token, { complete: true }) as any;

      if (!decoded || !decoded.payload) {
        res.status(401).json({ success: false, message: 'Invalid token format' });
        return;
      }

      const payload = decoded.payload;

      // Clerk token: contains 'sub' + ('azp' or Clerk issuer)
      if (payload.sub && (payload.azp || payload.iss?.includes('clerk'))) {
        // Strict claim validation
        if (!payload.exp || !payload.iat) {
          res.status(401).json({ success: false, message: 'Token missing required claims' });
          return;
        }
        if (payload.exp * 1000 < Date.now()) {
          res.status(401).json({ success: false, message: 'Token expired' });
          return;
        }
        if (payload.iat * 1000 > Date.now() + 30000) {
          res.status(401).json({ success: false, message: 'Token issued in the future' });
          return;
        }
        if (payload.nbf && payload.nbf * 1000 > Date.now() + 30000) {
          res.status(401).json({ success: false, message: 'Token not yet valid' });
          return;
        }

        const clerkUserId = payload.sub;
        const email = payload.email ||
          payload.primary_email_address ||
          (payload.email_addresses && payload.email_addresses[0]) ||
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
          user = await withRetry(() => prisma.user.create({
            data: {
              id: clerkUserId,
              email: email,
              name: payload.name || payload.first_name || payload.username || 'User',
              password: 'clerk_managed',
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
      }

      // Local tokens: verify with JWT_SECRET (HS256)
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
      logger.error('Auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  } catch (error) {
    logger.error('Server auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};
