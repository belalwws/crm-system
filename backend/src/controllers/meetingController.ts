import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

// Get all meetings
export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, startDate, endDate } = req.query;

    const where: any = { ownerId: userId };
    
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};

// Get a single meeting
export const getMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, ownerId: userId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
};

// Create a meeting
export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, location, startTime, endTime, reminder, customerId, dealId } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'title, startTime, and endTime are required' });
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
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

// Update a meeting
export const updateMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, location, startTime, endTime, reminder, customerId, dealId } = req.body;

    const existingMeeting = await prisma.meeting.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
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
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
};

// Delete a meeting
export const deleteMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const meeting = await prisma.meeting.deleteMany({
      where: { id, ownerId: userId },
    });

    if (meeting.count === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
};

// Get calendar events (formatted for calendar view)
export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        ownerId: userId,
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

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
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
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: parseInt(limit as string),
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
};
