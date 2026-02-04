import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { DealStage } from '@prisma/client';

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
  };
  return stageMap[stage?.toLowerCase() || 'lead'] || 'LEAD';
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
    const deals = await prisma.deal.findMany({
      where: { ownerId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: deals.length,
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
        notes,
        ownerId: req.user?.id as string,
        customerId: customerRecord.id,
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
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    const { title, description, value, stage, probability, expectedCloseDate, closedDate, notes } = req.body;

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value }),
        ...(stage && { stage: mapStage(stage) }),
        ...(probability !== undefined && { probability }),
        ...(expectedCloseDate !== undefined && { expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null }),
        ...(closedDate !== undefined && { closedDate: closedDate ? new Date(closedDate) : null }),
        ...(notes !== undefined && { notes }),
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
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    await prisma.deal.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Deal deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting deal',
    });
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
      where: { ownerId: req.user?.id },
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
