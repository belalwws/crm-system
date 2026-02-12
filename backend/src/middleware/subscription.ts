import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { PLAN_LIMITS } from '../controllers/billingController';

type ResourceType = 'customers' | 'deals' | 'users' | 'storage' | 'aiRequests';

/**
 * Subscription enforcement middleware
 * Checks if the user's plan allows the requested action
 * 
 * Usage:
 *   router.post('/customers', protect, checkLimit('customers'), createCustomer);
 *   router.post('/ai/chat', protect, checkLimit('aiRequests'), aiChat);
 */
export function checkLimit(resource: ResourceType) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      let subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id },
      });

      // Auto-create subscription if missing
      if (!subscription) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        subscription = await prisma.subscription.create({
          data: {
            userId: req.user.id,
            plan: 'FREE',
            status: 'TRIALING',
            trialStart: new Date(),
            trialEnd,
          },
        });
      }

      // Check if trial expired and subscription is not active
      if (subscription.status === 'TRIALING' && subscription.trialEnd && subscription.trialEnd < new Date()) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELED' },
        });
        subscription.status = 'CANCELED';
      }

      // Allow access during active, trialing, or past_due (grace period)
      const allowedStatuses = ['ACTIVE', 'TRIALING', 'PAST_DUE'];
      if (!allowedStatuses.includes(subscription.status)) {
        res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please upgrade your plan.',
          code: 'SUBSCRIPTION_EXPIRED',
        });
        return;
      }

      const plan = subscription.plan as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[plan];

      // Check resource limit
      const limitMap: Record<ResourceType, { used: number; limit: number; field: string }> = {
        customers: { used: subscription.customersUsed, limit: limits.customers, field: 'customersUsed' },
        deals: { used: subscription.dealsUsed, limit: limits.deals, field: 'dealsUsed' },
        users: { used: subscription.usersUsed, limit: limits.users, field: 'usersUsed' },
        storage: { used: subscription.storageUsedMB, limit: limits.storageMB, field: 'storageUsedMB' },
        aiRequests: { used: subscription.aiRequestsUsed, limit: limits.aiRequests, field: 'aiRequestsUsed' },
      };

      const check = limitMap[resource];
      if (!check) {
        next();
        return;
      }

      // -1 means unlimited
      if (check.limit !== -1 && check.used >= check.limit) {
        res.status(403).json({
          success: false,
          message: `You have reached the ${resource} limit for your ${limits.name} plan (${check.limit}). Please upgrade.`,
          code: 'LIMIT_REACHED',
          resource,
          used: check.used,
          limit: check.limit,
          plan: subscription.plan,
        });
        return;
      }

      // Attach subscription to request for downstream use
      (req as any).subscription = subscription;
      next();
    } catch (error) {
      logger.error('Subscription check error:', error);
      // Don't block on subscription check failure
      next();
    }
  };
}

/**
 * Check if a specific feature is available on the user's plan
 */
type FeatureName = typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS]['features'][number];

export function checkFeature(feature: FeatureName) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id },
      });

      const plan = (subscription?.plan || 'FREE') as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[plan];

      if (!(limits.features as readonly string[]).includes(feature)) {
        res.status(403).json({
          success: false,
          message: `The ${feature} feature is not available on your ${limits.name} plan. Please upgrade.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          plan,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Feature check error:', error);
      next();
    }
  };
}

/**
 * Increment usage counter after successful resource creation
 * Call this after the actual creation succeeds
 */
export async function incrementUsage(userId: string, resource: ResourceType, amount: number = 1): Promise<void> {
  try {
    const fieldMap: Record<ResourceType, string> = {
      customers: 'customersUsed',
      deals: 'dealsUsed',
      users: 'usersUsed',
      storage: 'storageUsedMB',
      aiRequests: 'aiRequestsUsed',
    };

    const field = fieldMap[resource];
    if (!field) return;

    await prisma.subscription.updateMany({
      where: { userId },
      data: { [field]: { increment: amount } },
    });
  } catch (error) {
    logger.error('Error incrementing usage:', error);
  }
}

/**
 * Decrement usage counter after resource deletion
 */
export async function decrementUsage(userId: string, resource: ResourceType, amount: number = 1): Promise<void> {
  try {
    const fieldMap: Record<ResourceType, string> = {
      customers: 'customersUsed',
      deals: 'dealsUsed',
      users: 'usersUsed',
      storage: 'storageUsedMB',
      aiRequests: 'aiRequestsUsed',
    };

    const field = fieldMap[resource];
    if (!field) return;

    // Ensure we don't go below 0
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (sub) {
      const current = (sub as any)[field] || 0;
      const newValue = Math.max(0, current - amount);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { [field]: newValue },
      });
    }
  } catch (error) {
    logger.error('Error decrementing usage:', error);
  }
}
