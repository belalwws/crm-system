import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/auditLog';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

const meetingIncludes = {
  customer: { select: { id: true, name: true, email: true } },
  deal: { select: { id: true, title: true } },
};

// Get all meetings (with pagination)
export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const where: any = { ownerId: userId, deletedAt: null };

    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: meetingIncludes,
      }),
      prisma.meeting.count({ where }),
    ]);

    res.json({ success: true, data: meetings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    logger.error('Error fetching meetings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

// Get a single meeting
export const getMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
      include: meetingIncludes,
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.json({ success: true, data: meeting });
  } catch (error) {
    logger.error('Error fetching meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meeting' });
  }
};

// Create a meeting
export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, location, startTime, endTime, reminder, customerId, dealId } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'title, startTime, and endTime are required' });
    }

    // Validate ownership of referenced entities
    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId: userId } });
      if (!customer) {
        return res.status(403).json({ success: false, message: 'Customer not found or not authorized' });
      }
    }
    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, ownerId: userId } });
      if (!deal) {
        return res.status(403).json({ success: false, message: 'Deal not found or not authorized' });
      }
    }

    const meeting = await prisma.meeting.create({
      data: {
        ownerId: userId,
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reminder,
        customerId: customerId || null,
        dealId: dealId || null,
      },
      include: meetingIncludes,
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'Meeting',
      entityId: meeting.id,
      entityName: title,
      newValues: { startTime, endTime, location },
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    logger.error('Error creating meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

// Update a meeting
export const updateMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, location, startTime, endTime, reminder, customerId, dealId } = req.body;

    const existingMeeting = await prisma.meeting.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!existingMeeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title,
        description,
        location,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        reminder,
        customerId: customerId || null,
        dealId: dealId || null,
      },
      include: meetingIncludes,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Meeting',
      entityId: id,
      entityName: meeting.title,
    });

    res.json({ success: true, data: meeting });
  } catch (error) {
    logger.error('Error updating meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to update meeting' });
  }
};

// Soft delete a meeting
export const deleteMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    await prisma.meeting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'Meeting',
      entityId: id,
      entityName: meeting.title,
    });

    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    logger.error('Error deleting meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meeting' });
  }
};

// Get calendar events (formatted for calendar view)
export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'start and end dates are required' });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        startTime: {
          gte: new Date(start as string),
          lte: new Date(end as string),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    // Also get tasks with due dates
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        deletedAt: null,
        dueDate: {
          gte: new Date(start as string),
          lte: new Date(end as string),
        },
        status: { not: 'COMPLETED' },
      },
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    // Format for calendar
    const events = [
      ...meetings.map((m) => ({
        id: m.id,
        type: 'meeting' as const,
        title: m.title,
        start: m.startTime,
        end: m.endTime,
        location: m.location,
        customer: m.customer,
        deal: m.deal,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        start: t.dueDate,
        end: t.dueDate,
        priority: t.priority,
        customer: t.customer,
        deal: t.deal,
      })),
    ];

    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar events' });
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '5' } = req.query;

    const meetings = await prisma.meeting.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: parseInt(limit as string),
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, data: meetings });
  } catch (error) {
    logger.error('Error fetching upcoming meetings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming meetings' });
  }
};
