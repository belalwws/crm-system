import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';
import { createContactSchema, updateContactSchema } from '../lib/validators';

/**
 * @desc    Get all contacts for a customer
 * @route   GET /api/contacts?customerId=xxx
 */
export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.query;
    const where: any = { ownerId: req.user?.id };
    if (customerId) where.customerId = customerId as string;

    const contacts = await prisma.contact.findMany({
      where,
      include: { customer: { select: { id: true, name: true, company: true } } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: contacts, total: contacts.length });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Error fetching contacts' });
  }
};

/**
 * @desc    Get single contact
 * @route   GET /api/contacts/:id
 */
export const getContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
      include: { customer: { select: { id: true, name: true, company: true } } },
    });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({ success: false, message: 'Error fetching contact' });
  }
};

/**
 * @desc    Create contact
 * @route   POST /api/contacts
 */
export const createContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createContactSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ success: false, message: errors });
      return;
    }
    const { firstName, lastName, email, phone, title, department, isPrimary, linkedIn, notes, customerId } = validation.data;

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        title,
        department,
        isPrimary: isPrimary || false,
        linkedIn,
        notes,
        customerId,
        ownerId: req.user?.id as string,
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({ success: false, message: 'Error creating contact' });
  }
};

/**
 * @desc    Update contact
 * @route   PUT /api/contacts/:id
 */
export const updateContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    const validation = updateContactSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      res.status(400).json({ success: false, message: errors });
      return;
    }
    const { firstName, lastName, email, phone, title, department, isPrimary, linkedIn, notes } = validation.data;
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(linkedIn !== undefined && { linkedIn }),
        ...(notes !== undefined && { notes }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ success: false, message: 'Error updating contact' });
  }
};

/**
 * @desc    Delete contact
 * @route   DELETE /api/contacts/:id
 */
export const deleteContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Error deleting contact' });
  }
};
