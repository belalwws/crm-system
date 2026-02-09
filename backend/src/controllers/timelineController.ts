import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

/**
 * @desc    Get timeline events for a customer
 * @route   GET /api/timeline/customer/:customerId
 * @access  Private
 */
export const getCustomerTimeline = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { page = '1', limit = '30', type } = req.query as Record<string, string>;

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, ownerId: req.user?.id },
    });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const where: any = { customerId, ownerId: req.user?.id };
    if (type) where.type = type;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: events,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching timeline' });
  }
};

/**
 * @desc    Get timeline events for a deal
 * @route   GET /api/timeline/deal/:dealId
 * @access  Private
 */
export const getDealTimeline = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { page = '1', limit = '30', type } = req.query as Record<string, string>;

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, ownerId: req.user?.id },
    });
    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    const where: any = { dealId, ownerId: req.user?.id };
    if (type) where.type = type;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: events,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching timeline' });
  }
};

/**
 * @desc    Add a manual timeline event (note, call log, etc.)
 * @route   POST /api/timeline
 * @access  Private
 */
export const createTimelineEntry = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, title, description, metadata, customerId, dealId } = req.body;

    if (!type || !title) {
      res.status(400).json({ success: false, message: 'type and title are required' });
      return;
    }

    const event = await prisma.timelineEvent.create({
      data: {
        ownerId: req.user?.id as string,
        type: type as any,
        title,
        description,
        metadata: metadata || undefined,
        customerId,
        dealId,
      },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating timeline event' });
  }
};
