import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * @desc    Get all subscriptions (Admin only)
 * @route   GET /api/admin/subscriptions
 * @access  Admin
 */
export const getSubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, status, search, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (plan) where.plan = plan;
    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscriptions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
};

/**
 * @desc    Update user subscription (Admin override)
 * @route   PUT /api/admin/subscriptions/:userId
 * @access  Admin
 */
export const updateSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { plan, status } = req.body;

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        ...(plan && { plan }),
        ...(status && { status }),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    logger.info(`Admin ${req.user!.id} updated subscription for ${userId}: plan=${plan}, status=${status}`);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
};

/**
 * @desc    Get subscription stats (Admin only)
 * @route   GET /api/admin/subscriptions/stats
 * @access  Admin
 */
export const getSubscriptionStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [byPlan, byStatus, totalRevenue, trialExpiring] = await Promise.all([
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: true,
      }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Estimate MRR from active subscriptions
      prisma.subscription.findMany({
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        select: { plan: true },
      }),
      // Trials expiring in next 3 days
      prisma.subscription.count({
        where: {
          status: 'TRIALING',
          trialEnd: {
            gte: new Date(),
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const planPrices: Record<string, number> = {
      FREE: 0, STARTER: 29, PROFESSIONAL: 79, ENTERPRISE: 199,
    };

    const mrr = totalRevenue.reduce((sum, sub) => sum + (planPrices[sub.plan] || 0), 0);

    res.json({
      success: true,
      data: {
        byPlan: byPlan.reduce((acc: any, item) => { acc[item.plan] = item._count; return acc; }, {}),
        byStatus: byStatus.reduce((acc: any, item) => { acc[item.status] = item._count; return acc; }, {}),
        mrr,
        trialExpiring,
        totalSubscriptions: byPlan.reduce((sum, item) => sum + item._count, 0),
      },
    });
  } catch (error) {
    logger.error('Error fetching subscription stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription stats' });
  }
};

/**
 * @desc    Get enhanced platform stats (Admin only)
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
export const getAdminDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, newUsersThisMonth,
      totalCustomers, totalDeals, totalTasks,
      wonDeals, pushTokenCount,
      recentActivity, newUsersThisWeek,
      subscriptionsByPlan,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.deal.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.deal.aggregate({
        where: { stage: 'CLOSED_WON', deletedAt: null },
        _sum: { value: true },
        _count: true,
      }),
      prisma.pushToken.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, avatar: true } } },
      }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: true,
      }),
    ]);

    // User growth: count by day for last 30 days
    const userGrowth = await prisma.$queryRaw`
      SELECT DATE(\"createdAt\") as date, COUNT(*)::int as count
      FROM users
      WHERE \"createdAt\" >= ${thirtyDaysAgo}
      GROUP BY DATE(\"createdAt\")
      ORDER BY date ASC
    ` as { date: Date; count: number }[];

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          newUsersThisMonth,
          newUsersThisWeek,
          totalCustomers,
          totalDeals,
          totalTasks,
          revenue: {
            totalWon: wonDeals._sum.value || 0,
            dealsWon: wonDeals._count,
          },
        },
        mobile: {
          registeredDevices: pushTokenCount,
        },
        subscriptions: subscriptionsByPlan.reduce((acc: any, item) => {
          acc[item.plan] = item._count;
          return acc;
        }, {}),
        userGrowth,
        recentActivity,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard' });
  }
};

/**
 * @desc    Get push tokens (Admin only)
 * @route   GET /api/admin/push-tokens
 * @access  Admin
 */
export const getPushTokens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { platform, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit as string, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };
    if (platform) where.platform = platform;

    const [tokens, total] = await Promise.all([
      prisma.pushToken.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.pushToken.count({ where }),
    ]);

    const platformStats = await prisma.pushToken.groupBy({
      by: ['platform'],
      where: { isActive: true },
      _count: true,
    });

    res.json({
      success: true,
      data: tokens,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      platformStats: platformStats.reduce((acc: any, item) => {
        acc[item.platform] = item._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    logger.error('Error fetching push tokens:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch push tokens' });
  }
};

/**
 * @desc    Send push notification (Admin only)
 * @route   POST /api/admin/notifications/push
 * @access  Admin
 */
export const sendPushNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, body, data, target = 'all' } = req.body;

    if (!title || !body) {
      res.status(400).json({ success: false, message: 'Title and body are required' });
      return;
    }

    // Build token query based on target
    const where: any = { isActive: true };
    if (target.startsWith('platform:')) {
      where.platform = target.split(':')[1];
    } else if (target.startsWith('user:')) {
      where.userId = target.split(':')[1];
    }

    const tokens = await prisma.pushToken.findMany({
      where,
      select: { token: true, userId: true },
    });

    // Send via Expo Push API
    let sentCount = 0;
    let failCount = 0;
    
    if (tokens.length > 0) {
      const messages = tokens.map(t => ({
        to: t.token,
        sound: 'default' as const,
        title,
        body,
        data: data || {},
      }));

      try {
        const chunks = chunkArray(messages, 100);
        for (const chunk of chunks) {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk),
          });
          
          if (response.ok) {
            sentCount += chunk.length;
          } else {
            failCount += chunk.length;
          }
        }
      } catch (err) {
        logger.error('Push notification send error:', err);
        failCount = tokens.length;
      }
    }

    // Also create in-app notifications
    const userIds = [...new Set(tokens.map(t => t.userId))];
    if (target === 'all') {
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      for (const user of allUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title,
            message: body,
            metadata: data || null,
          },
        });
      }
    } else {
      for (const userId of userIds) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title,
            message: body,
            metadata: data || null,
          },
        });
      }
    }

    // Log the notification
    await prisma.pushNotificationLog.create({
      data: {
        title,
        body,
        data: data || undefined,
        target,
        sentBy: req.user!.id,
        sentCount,
        failCount,
      },
    });

    logger.info(`Admin ${req.user!.id} sent push notification to ${target}: ${sentCount} sent, ${failCount} failed`);

    res.json({
      success: true,
      message: `Notification sent to ${sentCount} devices`,
      data: { sentCount, failCount, totalDevices: tokens.length },
    });
  } catch (error) {
    logger.error('Error sending push notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send push notification' });
  }
};

/**
 * @desc    Get push notification history (Admin only)
 * @route   GET /api/admin/notifications/push/history
 * @access  Admin
 */
export const getPushNotificationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit as string, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.pushNotificationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.pushNotificationLog.count(),
    ]);

    res.json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Error fetching push notification history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch push notification history' });
  }
};

// Utility
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
