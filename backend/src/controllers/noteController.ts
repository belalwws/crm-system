import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logNoteAdded } from './activityController';
import { AuthRequest } from '../types';

// Get notes for an entity
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, taskId } = req.query;

    const where: any = { ownerId: userId };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;
    if (taskId) where.taskId = taskId;

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

// Create a note
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { content, customerId, dealId, taskId, pinned } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (!customerId && !dealId && !taskId) {
      return res.status(400).json({ error: 'customerId, dealId, or taskId is required' });
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

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

// Update a note
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, pinned } = req.body;

    const note = await prisma.note.updateMany({
      where: { id, ownerId: userId },
      data: {
        content,
        pinned,
        updatedAt: new Date(),
      },
    });

    if (note.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = await prisma.note.findUnique({
      where: { id },
    });

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
};

// Delete a note
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note = await prisma.note.deleteMany({
      where: { id, ownerId: userId },
    });

    if (note.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// Toggle pin status
export const togglePinNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingNote = await prisma.note.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { pinned: !existingNote.pinned },
    });

    res.json(note);
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
};
