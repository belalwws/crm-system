import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

/**
 * @desc    Get audit logs
 * @route   GET /api/audit-logs
 * @access  Private
 */
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      entityType, entityId, action,
      page = '1', limit = '50',
      startDate, endDate,
    } = req.query as Record<string, string>;

    const role = req.user?.role;
    const where: any = {};
    // ADMIN and MANAGER see all logs; regular users see only their own
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      where.userId = req.user?.id;
    }
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit logs' });
  }
};

/**
 * @desc    Get audit trail for a specific entity
 * @route   GET /api/audit-logs/:entityType/:entityId
 * @access  Private
 */
export const getEntityAuditTrail = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;

    const role = req.user?.role;
    const entityWhere: any = { entityType, entityId };
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      entityWhere.userId = req.user?.id;
    }

    const logs = await prisma.auditLog.findMany({
      where: entityWhere,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit trail' });
  }
};
