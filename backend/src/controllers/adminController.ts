import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { createAuditLog } from '../lib/auditLog';
import { sendEmail } from '../lib/email';
import logger from '../lib/logger';
import bcrypt from 'bcryptjs';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, isActive, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

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
          timezone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              customers: true,
              deals: true,
              tasksAssigned: true,
            },
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
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * @desc    Get single user details (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        avatar: true,
        phone: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            deals: true,
            tasksAssigned: true,
            tasksCreated: true,
            emailLogs: true,
            documents: true,
            notes: true,
            meetings: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

/**
 * @desc    Update user role (Admin only)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Admin
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (id === req.user!.id) {
      res.status(400).json({ success: false, message: 'Cannot change your own role' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const oldRole = targetUser.role;

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      entityName: targetUser.name,
      oldValues: { role: oldRole },
      newValues: { role },
    });

    logger.info(`Admin ${req.user!.email} changed role of ${targetUser.email} from ${oldRole} to ${role}`);

    res.json({ success: true, data: updated, message: `User role updated to ${role}` });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
};

/**
 * @desc    Activate/Deactivate user (Admin only)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Admin
 */
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (id === req.user!.id) {
      res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: isActive ? 'RESTORE' : 'DELETE',
      entityType: 'User',
      entityId: id,
      entityName: targetUser.name,
      oldValues: { isActive: targetUser.isActive },
      newValues: { isActive },
    });

    logger.info(`Admin ${req.user!.email} ${isActive ? 'activated' : 'deactivated'} user ${targetUser.email}`);

    res.json({
      success: true,
      data: updated,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    logger.error('Error toggling user status:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

/**
 * @desc    Update user profile (Admin or self)
 * @route   PUT /api/admin/users/:id
 * @access  Admin
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, company, phone, timezone, avatar } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(timezone !== undefined && { timezone }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        avatar: true,
        phone: true,
        timezone: true,
        isActive: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

/**
 * @desc    Delete user permanently (Admin only, use with caution)
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Instead of deleting, deactivate to preserve data integrity
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      entityName: targetUser.name,
    });

    logger.info(`Admin ${req.user!.email} deactivated user ${targetUser.email}`);

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

/**
 * @desc    Get platform stats (Admin only)
 * @route   GET /api/admin/stats
 * @access  Admin
 */
export const getPlatformStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      totalDeals,
      totalTasks,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.deal.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Revenue stats
    const wonDeals = await prisma.deal.aggregate({
      where: { stage: 'CLOSED_WON', deletedAt: null },
      _sum: { value: true },
      _count: true,
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: usersByRole.reduce((acc: any, item) => {
            acc[item.role] = item._count;
            return acc;
          }, {}),
        },
        entities: {
          customers: totalCustomers,
          deals: totalDeals,
          tasks: totalTasks,
        },
        revenue: {
          totalWon: wonDeals._sum.value || 0,
          dealsWon: wonDeals._count,
        },
        recentActivity: recentAuditLogs,
      },
    });
  } catch (error) {
    logger.error('Error fetching platform stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
  }
};

/**
 * @desc    Invite a new user (Admin only)
 * @route   POST /api/admin/invite
 * @access  Admin
 */
export const inviteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, role = 'USER' } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, message: 'email and name are required' });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    // Generate a temporary password
    const tempPassword = (await import('crypto')).randomBytes(12).toString('base64url') + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as any,
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Send invitation email
    await sendEmail(
      email,
      'You have been invited to the CRM Platform',
      `Hello ${name},\n\nYou have been invited to join the CRM platform.\n\nYour temporary credentials:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\nCRM Admin`
    );

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      entityName: `Invited ${name} (${email})`,
    });

    logger.info(`Admin ${req.user!.id} invited user ${email} with role ${role}`);

    res.status(201).json({ success: true, data: user, message: 'User invited successfully' });
  } catch (error) {
    logger.error('Error inviting user:', error);
    res.status(500).json({ success: false, message: 'Failed to invite user' });
  }
};

/**
 * @desc    Get system settings (Admin only)
 * @route   GET /api/admin/settings
 * @access  Admin
 */
export const getSystemSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'My CRM',
          defaultCurrency: 'USD',
          defaultTimezone: 'UTC',
          maxUsersAllowed: 50,
          features: {
            aiInsights: true,
            emailIntegration: true,
            documentStorage: true,
            workflows: true,
          },
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system settings' });
  }
};

/**
 * @desc    Update system settings (Admin only)
 * @route   PUT /api/admin/settings
 * @access  Admin
 */
export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, defaultCurrency, defaultTimezone, maxUsersAllowed, features } = req.body;

    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: companyName || 'My CRM',
          defaultCurrency: defaultCurrency || 'USD',
          defaultTimezone: defaultTimezone || 'UTC',
          maxUsersAllowed: maxUsersAllowed || 50,
          features: features || {},
        },
      });
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ...(companyName && { companyName }),
          ...(defaultCurrency && { defaultCurrency }),
          ...(defaultTimezone && { defaultTimezone }),
          ...(maxUsersAllowed && { maxUsersAllowed }),
          ...(features && { features }),
        },
      });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE',
      entityType: 'SystemSettings',
      entityId: settings.id,
      entityName: 'System settings updated',
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update system settings' });
  }
};
