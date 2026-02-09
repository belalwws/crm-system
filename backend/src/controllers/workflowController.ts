import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { createAuditLog } from '../lib/auditLog';

/**
 * @desc    Get all workflow rules
 * @route   GET /api/workflows
 * @access  Private
 */
export const getWorkflowRules = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const rules = await prisma.workflowRule.findMany({
      where: { ownerId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { logs: true } },
      },
    });
    res.status(200).json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching workflows' });
  }
};

/**
 * @desc    Create workflow rule
 * @route   POST /api/workflows
 * @access  Private
 */
export const createWorkflowRule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, trigger, conditions, actions, isActive } = req.body;

    if (!name || !trigger || !conditions || !actions) {
      res.status(400).json({ success: false, message: 'name, trigger, conditions, and actions are required' });
      return;
    }

    const rule = await prisma.workflowRule.create({
      data: {
        ownerId: req.user?.id as string,
        name,
        description,
        trigger: trigger as any,
        conditions,
        actions,
        isActive: isActive !== false,
      },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'CREATE',
      entityType: 'WorkflowRule',
      entityId: rule.id,
      entityName: rule.name,
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating workflow' });
  }
};

/**
 * @desc    Update workflow rule
 * @route   PUT /api/workflows/:id
 * @access  Private
 */
export const updateWorkflowRule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.workflowRule.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow rule not found' });
      return;
    }

    const { name, description, trigger, conditions, actions, isActive } = req.body;

    const rule = await prisma.workflowRule.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trigger && { trigger: trigger as any }),
        ...(conditions && { conditions }),
        ...(actions && { actions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating workflow' });
  }
};

/**
 * @desc    Delete workflow rule
 * @route   DELETE /api/workflows/:id
 * @access  Private
 */
export const deleteWorkflowRule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.workflowRule.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow rule not found' });
      return;
    }
    await prisma.workflowRule.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Workflow rule deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting workflow' });
  }
};

/**
 * @desc    Get workflow execution logs
 * @route   GET /api/workflows/:id/logs
 * @access  Private
 */
export const getWorkflowLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.workflowRule.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow rule not found' });
      return;
    }

    const logs = await prisma.workflowLog.findMany({
      where: { ruleId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching workflow logs' });
  }
};

/**
 * @desc    Toggle workflow active status
 * @route   PATCH /api/workflows/:id/toggle
 * @access  Private
 */
export const toggleWorkflowRule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.workflowRule.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow rule not found' });
      return;
    }

    const rule = await prisma.workflowRule.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    res.status(200).json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling workflow' });
  }
};
