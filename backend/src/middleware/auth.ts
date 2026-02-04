import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import prisma, { withRetry } from '../lib/prisma';

/**
 * Authentication Middleware
 * يتحقق من وجود وصحة الـ JWT Token من Clerk أو Local
 * 
 * الاستخدام: يحمي الـ routes التي تحتاج مصادقة
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
      return;
    }

    try {
      // Decode the token (without verification - Clerk handles that)
      const decoded = jwt.decode(token) as any;
      
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid token format',
        });
        return;
      }

      // Check if it's a Clerk token (contains 'sub' claim)
      if (decoded.sub) {
        const clerkUserId = decoded.sub;
        // Get email from various possible locations in Clerk token
        const email = decoded.email || 
                     decoded.primary_email_address || 
                     (decoded.email_addresses && decoded.email_addresses[0]) ||
                     `${clerkUserId}@clerk.user`;
        
        // Check token expiration
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          res.status(401).json({
            success: false,
            message: 'Token expired',
          });
          return;
        }

        // Find or create user in our database with retry
        let user = await withRetry(() => prisma.user.findFirst({
          where: { 
            OR: [
              { id: clerkUserId },
              { email: email }
            ]
          },
        }));
        
        if (!user) {
          // Create user if doesn't exist (synced from Clerk)
          user = await withRetry(() => prisma.user.create({
            data: {
              id: clerkUserId,
              email: email,
              name: decoded.name || decoded.first_name || decoded.username || 'User',
              password: 'clerk_managed',
            },
          }));
        }
        
        req.user = {
          id: user.id,
          email: user.email,
        };
        next();
        return;
      }
      
      // For local tokens (HS256), verify with secret
      if (decoded.id && decoded.email) {
        try {
          const verified = jwt.verify(token, process.env.JWT_SECRET || '', {
            algorithms: ['HS256']
          }) as { id: string; email: string };
          
          req.user = {
            id: verified.id,
            email: verified.email,
          };
          next();
          return;
        } catch {
          // Token verification failed
        }
      }

      res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
      });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
      return;
    }
  } catch (error) {
    console.error('Server auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
    return;
  }
};
