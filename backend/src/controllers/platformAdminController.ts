import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import os from 'os';

// Platform Admin Credentials (from environment)
// Platform credentials loaded at runtime (not module load time)
const getAdminUsername = () => process.env.PLATFORM_ADMIN_USERNAME || 'nexus_superadmin';
const getAdminPassword = () => process.env.PLATFORM_ADMIN_PASSWORD || 'NexusCRM@2026!SecureAdmin#Platform';
const getAdminSecret = () => process.env.PLATFORM_ADMIN_SECRET || 'platform_admin_jwt_secret_key_2026';



/**
 * @desc    Platform Admin Login
 * @route   POST /api/platform-admin/login
 * @access  Public (with secret credentials)
 */
export const platformAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password required' });
      return;
    }

    // Verify credentials
    if (username !== getAdminUsername()) {
      logger.warn(`Platform admin login attempt with invalid username: ${username}`);
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Direct comparison for simplicity (password is from env)
    if (password !== getAdminPassword()) {
      logger.warn('Platform admin login attempt with invalid password');
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { isPlatformAdmin: true, username },
      getAdminSecret(),
      { expiresIn: '4h' }
    );

    logger.info('Platform admin logged in successfully');

    res.json({
      success: true,
      token,
      expiresIn: 4 * 60 * 60, // 4 hours in seconds
    });
  } catch (error) {
    logger.error('Platform admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * Middleware to verify platform admin token
 */
export const verifyPlatformAdmin = (req: Request, res: Response, next: Function): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getAdminSecret()) as { isPlatformAdmin: boolean };
    
    if (!decoded.isPlatformAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized as platform admin' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * @desc    Get platform overview stats
 * @route   GET /api/platform-admin/overview
 * @access  Platform Admin
 */
export const getPlatformOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      totalDeals,
      totalTasks,
      totalActivities,
      totalNotes,
      totalProducts,
      totalQuotes,
      usersLast24h,
      usersLast7d,
      usersLast30d,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.deal.count(),
      prisma.task.count(),
      prisma.activity.count(),
      prisma.note.count(),
      prisma.product.count(),
      prisma.quote.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Get deals by stage
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      _count: { id: true },
      _sum: { value: true },
    });

    // Get revenue stats
    const wonDeals = await prisma.deal.aggregate({
      where: { stage: 'CLOSED_WON' },
      _sum: { value: true },
      _count: { id: true },
    });

    // Get user roles distribution
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    // Get subscription stats
    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          newLast24h: usersLast24h,
          newLast7d: usersLast7d,
          newLast30d: usersLast30d,
          byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count.id }), {}),
        },
        data: {
          customers: totalCustomers,
          deals: totalDeals,
          tasks: totalTasks,
          activities: totalActivities,
          notes: totalNotes,
          products: totalProducts,
          quotes: totalQuotes,
        },
        revenue: {
          totalWon: wonDeals._sum?.value || 0,
          dealsWon: wonDeals._count?.id || 0,
        },
        dealsByStage: dealsByStage.map(d => ({
          stage: d.stage,
          count: d._count.id,
          value: d._sum.value || 0,
        })),
        subscriptions: subscriptionStats.reduce((acc, s) => ({ ...acc, [s.plan]: s._count.id }), {}),
      },
    });
  } catch (error) {
    logger.error('Platform overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform overview' });
  }
};

/**
 * @desc    Get system health status
 * @route   GET /api/platform-admin/health
 * @access  Platform Admin
 */
export const getSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
        nodeHeap: process.memoryUsage().heapUsed,
        nodeHeapTotal: process.memoryUsage().heapTotal,
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        loadAvg: os.loadavg(),
      },
      platform: os.platform(),
      hostname: os.hostname(),
      nodeVersion: process.version,
    };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
        system: systemMetrics,
      },
    });
  } catch (error) {
    logger.error('System health check error:', error);
    res.status(500).json({
      success: true,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: { status: 'error' },
        error: 'Health check failed',
      },
    });
  }
};

/**
 * @desc    Get all users for platform admin
 * @route   GET /api/platform-admin/users
 * @access  Platform Admin
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, isActive, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: { plan: true, status: true },
          },
          _count: {
            select: { customers: true, deals: true, tasksAssigned: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * @desc    Update user as platform admin
 * @route   PUT /api/platform-admin/users/:id
 * @access  Platform Admin
 */
export const updateUserAsPlatformAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, isActive, name, company } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        company: true,
      },
    });

    logger.info(`Platform admin updated user ${id}: ${JSON.stringify(updateData)}`);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

/**
 * @desc    Delete user as platform admin
 * @route   DELETE /api/platform-admin/users/:id
 * @access  Platform Admin
 */
export const deleteUserAsPlatformAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Delete user and all related data
    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { ownerId: id } }),
      prisma.note.deleteMany({ where: { ownerId: id } }),
      prisma.task.deleteMany({ where: { OR: [{ assignedToId: id }, { createdById: id }] } }),
      prisma.deal.deleteMany({ where: { ownerId: id } }),
      prisma.customer.deleteMany({ where: { ownerId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.subscription.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    logger.info(`Platform admin deleted user ${id} (${user.email})`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

/**
 * @desc    Get audit logs
 * @route   GET /api/platform-admin/audit-logs
 * @access  Platform Admin
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, action, entityType, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

/**
 * @desc    Get database statistics
 * @route   GET /api/platform-admin/db-stats
 * @access  Platform Admin
 */
export const getDatabaseStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get counts for all main tables
    const [
      users, customers, contacts, deals, tasks, activities, 
      notes, products, quotes, documents, notifications, auditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.task.count(),
      prisma.activity.count(),
      prisma.note.count(),
      prisma.product.count(),
      prisma.quote.count(),
      prisma.document.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        tables: {
          users,
          customers,
          contacts,
          deals,
          tasks,
          activities,
          notes,
          products,
          quotes,
          documents,
          notifications,
          auditLogs,
        },
        totalRecords: users + customers + contacts + deals + tasks + activities + notes + products + quotes + documents + notifications + auditLogs,
      },
    });
  } catch (error) {
    logger.error('Get database stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch database stats' });
  }
};

/**
 * @desc    Change platform admin password
 * @route   POST /api/platform-admin/change-password
 * @access  Platform Admin
 */
export const changePlatformAdminPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password required' });
      return;
    }

    if (currentPassword !== getAdminPassword()) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    // Note: In production, you would update this in a secure database or vault
    // This is just for demonstration
    res.json({
      success: true,
      message: 'To change the password, update getAdminPassword() in your .env file',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};




/**
 * @desc    Update user subscription as platform admin
 * @route   PUT /api/platform-admin/users/:id/subscription
 * @access  Platform Admin
 */
export const updateUserSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!plan || !['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan)) {
      res.status(400).json({ success: false, message: 'Invalid plan. Must be FREE, STARTER, PROFESSIONAL, or ENTERPRISE' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: id },
      update: { plan, status: 'ACTIVE' },
      create: { 
        userId: id, 
        plan, 
        status: 'ACTIVE',
        trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('Platform admin updated subscription for user ' + id + ' to ' + plan);
    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
};

/**
 * @desc    Update user profile as platform admin
 * @route   PUT /api/platform-admin/users/:id/profile
 * @access  Platform Admin
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, company, phone, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        isActive: true,
        role: true,
      },
    });

    logger.info('Platform admin updated profile for user ' + id);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};




