import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { DealStage } from '@prisma/client';
import { createAuditLog, createTimelineEvent, computeDiff } from '../lib/auditLog';
import { evaluateWorkflows, fireWebhooks } from '../lib/workflowEngine';

/**
 * Helper: Map frontend stage to Prisma enum
 */
const mapStage = (stage?: string): DealStage => {
  const stageMap: Record<string, DealStage> = {
    lead: 'LEAD',
    qualified: 'QUALIFIED',
    proposal: 'PROPOSAL',
    negotiation: 'NEGOTIATION',
    'closed-won': 'CLOSED_WON',
    'closed-lost': 'CLOSED_LOST',
    LEAD: 'LEAD',
    QUALIFIED: 'QUALIFIED',
    PROPOSAL: 'PROPOSAL',
    NEGOTIATION: 'NEGOTIATION',
    CLOSED_WON: 'CLOSED_WON',
    CLOSED_LOST: 'CLOSED_LOST',
  };
  return stageMap[stage || 'LEAD'] || 'LEAD';
};

/**
 * Helper: Map Prisma stage to frontend format
 */
const formatStage = (stage: DealStage): string => {
  const stageMap: Record<DealStage, string> = {
    LEAD: 'lead',
    QUALIFIED: 'qualified',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    CLOSED_WON: 'closed-won',
    CLOSED_LOST: 'closed-lost',
  };
  return stageMap[stage];
};

/**
 * Helper: Format deal for frontend
 */
const formatDeal = (deal: any) => ({
  ...deal,
  _id: deal.id,
  stage: formatStage(deal.stage),
  customer: deal.customer ? {
    ...deal.customer,
    _id: deal.customer.id,
  } : null,
  owner: deal.owner,
});

/**
 * @desc    Get all deals
 * @route   GET /api/deals
 * @access  Private (Multi-tenant)
 */
export const getDeals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search, stage, customerId, minValue, maxValue,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = '1', limit = '50', includeDeleted,
    } = req.query as Record<string, string>;

    const where: any = {
      ownerId: req.user?.id,
      ...(includeDeleted !== 'true' && { deletedAt: null }),
    };

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'value', 'stage', 'probability', 'expectedCloseDate'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (stage) where.stage = mapStage(stage);
    if (customerId) where.customerId = customerId;
    if (minValue) where.value = { ...where.value, gte: parseFloat(minValue) };
    if (maxValue) where.value = { ...where.value, lte: parseFloat(maxValue) };

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true, email: true, company: true } },
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, notes: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: deals.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      data: deals.map(formatDeal),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deals',
    });
  }
};

/**
 * @desc    Get single deal
 * @route   GET /api/deals/:id
 * @access  Private (Multi-tenant)
 */
export const getDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!deal) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatDeal(deal),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deal',
    });
  }
};

/**
 * @desc    Create new deal
 * @route   POST /api/deals
 * @access  Private (Multi-tenant)
 */
export const createDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, value, stage, probability, customer, customerId, expectedCloseDate, notes } = req.body;

    // Verify customer belongs to user
    const customerRecord = await prisma.customer.findFirst({
      where: {
        id: customerId || customer,
        ownerId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!customerRecord) {
      res.status(400).json({
        success: false,
        message: 'Customer not found or does not belong to you',
      });
      return;
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        value: value || 0,
        stage: mapStage(stage),
        probability: probability || 10,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notesText: notes,
        ownerId: req.user?.id as string,
        customerId: customerRecord.id,
      },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'CREATE',
      entityType: 'Deal',
      entityId: deal.id,
      entityName: deal.title,
      newValues: { title, value, stage: deal.stage },
    });

    await createTimelineEvent({
      ownerId: req.user?.id as string,
      type: 'DEAL_CREATED',
      title: `Deal "${title}" created`,
      metadata: { value, stage: deal.stage },
      customerId: customerRecord.id,
      dealId: deal.id,
    });

    fireWebhooks(req.user?.id as string, 'deal.created', { deal: formatDeal(deal) });
    evaluateWorkflows({
      userId: req.user?.id as string,
      entityType: 'Deal',
      entityId: deal.id,
      trigger: 'DEAL_CREATED',
      newData: deal as any,
    });

    res.status(201).json({
      success: true,
      data: formatDeal(deal),
      message: 'Deal created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating deal',
    });
  }
};

/**
 * @desc    Update deal
 * @route   PUT /api/deals/:id
 * @access  Private (Multi-tenant)
 */
export const updateDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if deal exists and belongs to user
    const existing = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    const { title, description, value, stage, probability, expectedCloseDate, closedDate, notes, lostReason } = req.body;

    const newStage = stage ? mapStage(stage) : undefined;
    const isClosedWon = newStage === 'CLOSED_WON' && existing.stage !== 'CLOSED_WON';
    const isClosedLost = newStage === 'CLOSED_LOST' && existing.stage !== 'CLOSED_LOST';

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value }),
        ...(newStage && { stage: newStage }),
        ...(probability !== undefined && { probability }),
        ...(expectedCloseDate !== undefined && { expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null }),
        ...(closedDate !== undefined && { closedDate: closedDate ? new Date(closedDate) : null }),
        ...(notes !== undefined && { notesText: notes }),
        ...(lostReason !== undefined && { lostReason }),
        ...((isClosedWon || isClosedLost) && !closedDate && { closedDate: new Date() }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit trail
    const diff = computeDiff(existing as any, deal as any, [
      'title', 'value', 'stage', 'probability', 'expectedCloseDate', 'lostReason',
    ]);
    if (diff) {
      await createAuditLog({
        userId: req.user?.id as string,
        action: newStage && newStage !== existing.stage ? 'STAGE_CHANGE' : 'UPDATE',
        entityType: 'Deal',
        entityId: deal.id,
        entityName: deal.title,
        oldValues: diff.oldValues,
        newValues: diff.newValues,
      });
    }

    // Stage change tracking
    if (newStage && newStage !== existing.stage) {
      const eventType = isClosedWon ? 'DEAL_WON' : isClosedLost ? 'DEAL_LOST' : 'STAGE_CHANGED';
      await createTimelineEvent({
        ownerId: req.user?.id as string,
        type: eventType,
        title: `Stage: ${formatStage(existing.stage)} → ${formatStage(newStage as DealStage)}`,
        metadata: { oldStage: existing.stage, newStage, value: deal.value },
        customerId: deal.customerId,
        dealId: deal.id,
      });

      // Notify on won/lost
      if (isClosedWon || isClosedLost) {
        const notification = await prisma.notification.create({
          data: {
            userId: req.user?.id as string,
            type: isClosedWon ? 'DEAL_WON' : 'DEAL_LOST',
            title: isClosedWon ? '🎉 Deal Won!' : 'Deal Lost',
            message: `"${deal.title}" - $${Number(deal.value).toLocaleString()}`,
            link: `/dashboard/deals/${deal.id}`,
          },
        });

        // Real-time push
        const { emitToUser } = await import('../lib/socket');
        emitToUser(req.user?.id as string, 'notification:new', notification);

        fireWebhooks(req.user?.id as string, isClosedWon ? 'deal.won' : 'deal.lost', { deal: formatDeal(deal) });
      }

      evaluateWorkflows({
        userId: req.user?.id as string,
        entityType: 'Deal',
        entityId: deal.id,
        trigger: 'DEAL_STAGE_CHANGED',
        oldData: existing as any,
        newData: deal as any,
      });
    }

    fireWebhooks(req.user?.id as string, 'deal.updated', { deal: formatDeal(deal) });

    res.status(200).json({
      success: true,
      data: formatDeal(deal),
      message: 'Deal updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating deal',
    });
  }
};

/**
 * @desc    Delete deal
 * @route   DELETE /api/deals/:id
 * @access  Private (Multi-tenant)
 */
export const deleteDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    await prisma.deal.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedById: req.user?.id },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'DELETE',
      entityType: 'Deal',
      entityId: existing.id,
      entityName: existing.title,
    });

    fireWebhooks(req.user?.id as string, 'deal.deleted', { dealId: existing.id, title: existing.title });

    res.status(200).json({ success: true, data: {}, message: 'Deal deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting deal' });
  }
};

/**
 * @desc    Restore soft-deleted deal
 * @route   POST /api/deals/:id/restore
 * @access  Private
 */
export const restoreDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.deal.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id, deletedAt: { not: null } },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Deleted deal not found' });
      return;
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { deletedAt: null, deletedById: null },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'RESTORE',
      entityType: 'Deal',
      entityId: deal.id,
      entityName: deal.title,
    });

    res.status(200).json({ success: true, data: formatDeal(deal), message: 'Deal restored successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error restoring deal' });
  }
};

/**
 * @desc    Get deals statistics
 * @route   GET /api/deals/stats
 * @access  Private (Multi-tenant)
 */
export const getDealStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await prisma.deal.groupBy({
      by: ['stage'],
      where: { ownerId: req.user?.id, deletedAt: null },
      _count: { id: true },
      _sum: { value: true },
    });

    const formattedStats = stats.map((s) => ({
      _id: formatStage(s.stage),
      count: s._count.id,
      totalValue: s._sum.value || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deal statistics',
    });
  }
};
