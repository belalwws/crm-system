import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/email';
import { logEmailSent } from './activityController';
import { AuthRequest } from '../types';

// Send an email
export const sendEmailToCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { to, subject, body, customerId, dealId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
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
      res.json({ success: true, emailLog });
    } else {
      res.status(500).json({ error: 'Failed to send email', details: result.error });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Get email history
export const getEmailHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId } = req.query;

    const where: any = { ownerId: userId };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    const emails = await prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json(emails);
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ error: 'Failed to fetch email history' });
  }
};

// Get email templates
export const getEmailTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const templates = await prisma.emailTemplate.findMany({
      where: { ownerId: userId },
      orderBy: { name: 'asc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
};

// Create email template
export const createEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'name, subject, and body are required' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        ownerId: userId,
        name,
        subject,
        body,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
};

// Update email template
export const updateEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, subject, body } = req.body;

    const template = await prisma.emailTemplate.updateMany({
      where: { id, ownerId: userId },
      data: {
        name,
        subject,
        body,
        updatedAt: new Date(),
      },
    });

    if (template.count === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updatedTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
};

// Delete email template
export const deleteEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const template = await prisma.emailTemplate.deleteMany({
      where: { id, ownerId: userId },
    });

    if (template.count === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
};
