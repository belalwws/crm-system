import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logNoteAdded } from './activityController';
import { createAuditLog } from '../lib/auditLog';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

// Get notes for an entity (with pagination)
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, taskId, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const where: any = { ownerId: userId, deletedAt: null };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;
    if (taskId) where.taskId = taskId;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.note.count({ where }),
    ]);

    res.json({ success: true, data: notes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    logger.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

// Create a note
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { content, customerId, dealId, taskId, pinned } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'content is required' });
    }

    if (!customerId && !dealId && !taskId) {
      return res.status(400).json({ success: false, message: 'customerId, dealId, or taskId is required' });
    }

    const note = await prisma.note.create({
      data: {
        ownerId: userId,
        content,
        customerId: customerId || null,
        dealId: dealId || null,
        taskId: taskId || null,
        pinned: pinned || false,
      },
    });

    // Log activity
    if (customerId) {
      await logNoteAdded(userId, 'customer', customerId, content);
    } else if (dealId) {
      await logNoteAdded(userId, 'deal', dealId, content);
    } else if (taskId) {
      await logNoteAdded(userId, 'task', taskId, content);
    }

    // Audit log
    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'Note',
      entityId: note.id,
      entityName: content.substring(0, 50),
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    logger.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
};

// Update a note
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, pinned } = req.body;

    const existing = await prisma.note.findFirst({ where: { id, ownerId: userId, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { content, pinned, updatedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Note',
      entityId: id,
      entityName: (content || existing.content).substring(0, 50),
    });

    res.json({ success: true, data: updatedNote });
  } catch (error) {
    logger.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Failed to update note' });
  }
};

// Soft delete a note
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note = await prisma.note.findFirst({ where: { id, ownerId: userId, deletedAt: null } });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'Note',
      entityId: id,
      entityName: note.content.substring(0, 50),
    });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    logger.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};

// Toggle pin status
export const togglePinNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingNote = await prisma.note.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!existingNote) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { pinned: !existingNote.pinned },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    logger.error('Error toggling pin:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle pin' });
  }
};
