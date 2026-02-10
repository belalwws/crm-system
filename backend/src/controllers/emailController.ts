import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/email';
import { logEmailSent } from './activityController';
import { createAuditLog } from '../lib/auditLog';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

// Send an email
export const sendEmailToCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { to, subject, body, customerId, dealId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: 'to, subject, and body are required' });
    }

    // Try to send the email
    const result = await sendEmail(to, subject, body);

    // Log the email
    const emailLog = await prisma.emailLog.create({
      data: {
        ownerId: userId,
        to,
        subject,
        body,
        customerId: customerId || null,
        dealId: dealId || null,
        status: result.success ? 'SENT' : 'FAILED',
      },
    });

    // Log activity
    if (result.success) {
      if (customerId) {
        await logEmailSent(userId, 'customer', customerId, to, subject);
      } else if (dealId) {
        await logEmailSent(userId, 'deal', dealId, to, subject);
      }
    }

    if (result.success) {
      res.json({ success: true, data: emailLog });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email', details: result.error });
    }
  } catch (error) {
    logger.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
};

// Get email history (with pagination)
export const getEmailHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const where: any = { ownerId: userId };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    res.json({ success: true, data: emails, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    logger.error('Error fetching email history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email history' });
  }
};

// Get email templates (with pagination)
export const getEmailTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const where = { ownerId: userId, deletedAt: null as Date | null };

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    res.json({ success: true, data: templates, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    logger.error('Error fetching email templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};

// Create email template
export const createEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ success: false, message: 'name, subject, and body are required' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        ownerId: userId,
        name,
        subject,
        body,
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'EmailTemplate',
      entityId: template.id,
      entityName: name,
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('Error creating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to create email template' });
  }
};

// Update email template
export const updateEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, subject, body } = req.body;

    const existing = await prisma.emailTemplate.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: { name, subject, body, updatedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'EmailTemplate',
      entityId: id,
      entityName: updatedTemplate.name,
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    logger.error('Error updating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to update email template' });
  }
};

// Soft delete email template
export const deleteEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const template = await prisma.emailTemplate.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await prisma.emailTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'EmailTemplate',
      entityId: id,
      entityName: template.name,
    });

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    logger.error('Error deleting email template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete email template' });
  }
};
