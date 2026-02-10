import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/auditLog';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

const MAX_BULK_SIZE = 100;

/**
 * Bulk delete customers (soft delete)
 */
export const bulkDeleteCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    const result = await prisma.customer.updateMany({
      where: { id: { in: ids }, ownerId: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'BULK_DELETE',
      entityType: 'Customer',
      entityId: 'bulk',
      entityName: `${result.count} customers`,
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (error) {
    logger.error('Bulk delete customers error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
};

/**
 * Bulk delete deals (soft delete)
 */
export const bulkDeleteDeals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    const result = await prisma.deal.updateMany({
      where: { id: { in: ids }, ownerId: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'BULK_DELETE',
      entityType: 'Deal',
      entityId: 'bulk',
      entityName: `${result.count} deals`,
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (error) {
    logger.error('Bulk delete deals error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
};

/**
 * Bulk delete tasks (soft delete)
 */
export const bulkDeleteTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: ids }, OR: [{ assignedToId: userId }, { createdById: userId }], deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'BULK_DELETE',
      entityType: 'Task',
      entityId: 'bulk',
      entityName: `${result.count} tasks`,
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (error) {
    logger.error('Bulk delete tasks error:', error);
    res.status(500).json({ success: false, message: 'Bulk delete failed' });
  }
};

/**
 * Bulk update deal stage
 */
export const bulkUpdateDealStage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids, stage } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !stage) {
      return res.status(400).json({ success: false, message: 'ids array and stage are required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    const result = await prisma.deal.updateMany({
      where: { id: { in: ids }, ownerId: userId, deletedAt: null },
      data: { stage },
    });

    await createAuditLog({
      userId,
      action: 'BULK_UPDATE',
      entityType: 'Deal',
      entityId: 'bulk',
      entityName: `${result.count} deals → ${stage}`,
    });

    res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    logger.error('Bulk update deal stage error:', error);
    res.status(500).json({ success: false, message: 'Bulk update failed' });
  }
};

/**
 * Bulk update task status
 */
export const bulkUpdateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'ids array and status are required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: ids }, OR: [{ assignedToId: userId }, { createdById: userId }], deletedAt: null },
      data: { status },
    });

    await createAuditLog({
      userId,
      action: 'BULK_UPDATE',
      entityType: 'Task',
      entityId: 'bulk',
      entityName: `${result.count} tasks → ${status}`,
    });

    res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    logger.error('Bulk update task status error:', error);
    res.status(500).json({ success: false, message: 'Bulk update failed' });
  }
};

/**
 * Bulk assign tasks
 */
export const bulkAssignTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids, assignedToId } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !assignedToId) {
      return res.status(400).json({ success: false, message: 'ids array and assignedToId are required' });
    }
    if (ids.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: ids }, OR: [{ assignedToId: userId }, { createdById: userId }], deletedAt: null },
      data: { assignedToId },
    });

    await createAuditLog({
      userId,
      action: 'BULK_UPDATE',
      entityType: 'Task',
      entityId: 'bulk',
      entityName: `${result.count} tasks assigned to ${targetUser.name}`,
    });

    res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    logger.error('Bulk assign tasks error:', error);
    res.status(500).json({ success: false, message: 'Bulk assign failed' });
  }
};
