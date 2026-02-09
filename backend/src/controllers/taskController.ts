import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { TaskType, Priority, TaskStatus } from '@prisma/client';
import { createAuditLog, createTimelineEvent } from '../lib/auditLog';
import { fireWebhooks } from '../lib/workflowEngine';

/**
 * Helper: Map frontend type to Prisma enum
 */
const mapType = (type?: string): TaskType => {
  const typeMap: Record<string, TaskType> = {
    call: 'CALL',
    email: 'EMAIL',
    meeting: 'MEETING',
    'follow-up': 'FOLLOW_UP',
    whatsapp: 'WHATSAPP',
    other: 'OTHER',
  };
  return typeMap[type?.toLowerCase() || 'other'] || 'OTHER';
};

/**
 * Helper: Map frontend priority to Prisma enum
 */
const mapPriority = (priority?: string): Priority => {
  const priorityMap: Record<string, Priority> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    urgent: 'URGENT',
  };
  return priorityMap[priority?.toLowerCase() || 'medium'] || 'MEDIUM';
};

/**
 * Helper: Map frontend status to Prisma enum
 */
const mapStatus = (status?: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    pending: 'PENDING',
    'in-progress': 'IN_PROGRESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
  };
  return statusMap[status?.toLowerCase() || 'pending'] || 'PENDING';
};

/**
 * Helper: Format task for frontend
 */
const formatTask = (task: any) => ({
  ...task,
  _id: task.id,
  type: task.type.toLowerCase().replace('_', '-'),
  priority: task.priority.toLowerCase(),
  status: task.status.toLowerCase().replace('_', '-'),
  customer: task.customer ? { ...task.customer, _id: task.customer.id } : null,
  deal: task.deal ? { ...task.deal, _id: task.deal.id } : null,
  assignedTo: task.assignedTo,
  createdBy: task.createdBy,
});

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Private (Multi-tenant)
 */
export const getTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search, status, priority, type, customerId, dealId,
      overdue, sortBy = 'dueDate', sortOrder = 'asc',
      page = '1', limit = '50', includeDeleted,
    } = req.query as Record<string, string>;

    const where: any = {
      assignedToId: req.user?.id,
      ...(includeDeleted !== 'true' && { deletedAt: null }),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = mapStatus(status);
    if (priority) where.priority = mapPriority(priority);
    if (type) where.type = mapType(type);
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          deal: { select: { id: true, title: true, value: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      data: tasks.map(formatTask),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tasks',
    });
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private (Multi-tenant)
 */
export const getTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        assignedToId: req.user?.id,
        deletedAt: null,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        deal: {
          select: { id: true, title: true, value: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatTask(task),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching task',
    });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private (Multi-tenant)
 */
export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, type, priority, status, dueDate, customer, customerId, deal, dealId, notes } = req.body;

    // Verify customer belongs to user if provided
    if (customerId || customer) {
      const customerRecord = await prisma.customer.findFirst({
        where: {
          id: customerId || customer,
          ownerId: req.user?.id,
        },
      });
      if (!customerRecord) {
        res.status(400).json({
          success: false,
          message: 'Customer not found or does not belong to you',
        });
        return;
      }
    }

    // Verify deal belongs to user if provided
    if (dealId || deal) {
      const dealRecord = await prisma.deal.findFirst({
        where: {
          id: dealId || deal,
          ownerId: req.user?.id,
        },
      });
      if (!dealRecord) {
        res.status(400).json({
          success: false,
          message: 'Deal not found or does not belong to you',
        });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        type: mapType(type),
        priority: mapPriority(priority),
        status: mapStatus(status),
        dueDate: dueDate ? new Date(dueDate) : null,
        notesText: notes,
        assignedToId: req.user?.id as string,
        createdById: req.user?.id as string,
        customerId: customerId || customer || null,
        dealId: dealId || deal || null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task.id,
      entityName: task.title,
      newValues: { title, type: task.type, priority: task.priority, dueDate },
    });

    // Timeline event if linked to customer
    if (task.customerId) {
      await createTimelineEvent({
        ownerId: req.user?.id as string,
        type: 'TASK_CREATED',
        title: `Task "${title}" created`,
        metadata: { type: task.type, priority: task.priority },
        customerId: task.customerId,
        dealId: task.dealId || undefined,
      });
    }

    res.status(201).json({
      success: true,
      data: formatTask(task),
      message: 'Task created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task',
    });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private (Multi-tenant)
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if task exists and belongs to user
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        assignedToId: req.user?.id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    const { title, description, type, priority, status, dueDate, completedDate, notes } = req.body;

    // If status is being changed to completed, set completedDate
    let finalCompletedDate = completedDate;
    if (status === 'completed' && existing.status !== 'COMPLETED') {
      finalCompletedDate = new Date();
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type: mapType(type) }),
        ...(priority && { priority: mapPriority(priority) }),
        ...(status && { status: mapStatus(status) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(finalCompletedDate !== undefined && { completedDate: finalCompletedDate ? new Date(finalCompletedDate) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        deal: {
          select: { id: true, title: true, value: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: formatTask(task),
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating task',
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Multi-tenant)
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        assignedToId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedById: req.user?.id },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'DELETE',
      entityType: 'Task',
      entityId: existing.id,
      entityName: existing.title,
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting task',
    });
  }
};

/**
 * @desc    Restore soft-deleted task
 * @route   POST /api/tasks/:id/restore
 * @access  Private
 */
export const restoreTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, assignedToId: req.user?.id, deletedAt: { not: null } },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Deleted task not found' });
      return;
    }
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: null, deletedById: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    await createAuditLog({ userId: req.user?.id as string, action: 'RESTORE', entityType: 'Task', entityId: task.id, entityName: task.title });
    res.status(200).json({ success: true, data: formatTask(task), message: 'Task restored' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error restoring task' });
  }
};
