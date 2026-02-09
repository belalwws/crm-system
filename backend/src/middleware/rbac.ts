import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

/**
 * Role-Based Access Control Middleware
 * 
 * Usage:
 *   router.get('/admin-only', protect, requireRole('ADMIN'), handler);
 *   router.get('/managers', protect, requireRole('ADMIN', 'MANAGER'), handler);
 */
export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, isActive: true },
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated' });
        return;
      }

      if (!roles.includes(user.role)) {
        logger.warn(`Access denied: User ${req.user.id} with role ${user.role} tried to access route requiring ${roles.join('/')}`);
        res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
        return;
      }

      // Attach role to request for downstream use
      req.user.role = user.role;
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
}

/**
 * Middleware to attach user role to request (non-blocking)
 * Use on routes where role is needed but all roles are allowed
 */
export async function attachRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, isActive: true, name: true },
      });
      if (user) {
        req.user.role = user.role;
        req.user.name = user.name;
      }
    }
    next();
  } catch {
    next();
  }
}
