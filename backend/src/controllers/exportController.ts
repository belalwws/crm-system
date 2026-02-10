import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * Export customers as CSV
 */
export const exportCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const customers = await prisma.customer.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Industry', 'Website', 'Created At'];
    const rows = customers.map((c) => [
      c.name, c.email, c.phone || '', c.company || '', c.status,
      c.source || '', c.industry || '', c.website || '',
      c.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting customers:', error);
    res.status(500).json({ success: false, message: 'Failed to export customers' });
  }
};

/**
 * Export deals as CSV
 */
export const exportDeals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const deals = await prisma.deal.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Title', 'Customer', 'Value', 'Stage', 'Probability', 'Expected Close', 'Created At'];
    const rows = deals.map((d) => [
      d.title, d.customer.name, d.value.toString(), d.stage,
      d.probability.toString(), d.expectedCloseDate?.toISOString() || '',
      d.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deals.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting deals:', error);
    res.status(500).json({ success: false, message: 'Failed to export deals' });
  }
};

/**
 * Export tasks as CSV
 */
export const exportTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId, deletedAt: null },
      include: {
        customer: { select: { name: true } },
        deal: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Title', 'Type', 'Priority', 'Status', 'Due Date', 'Customer', 'Deal', 'Created At'];
    const rows = tasks.map((t) => [
      t.title, t.type, t.priority, t.status,
      t.dueDate?.toISOString() || '', t.customer?.name || '', t.deal?.title || '',
      t.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to export tasks' });
  }
};

/**
 * Import customers from CSV
 */
export const importCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        if (!row.name || !row.email) {
          results.skipped++;
          continue;
        }

        // Check duplicates
        const existing = await prisma.customer.findFirst({
          where: { ownerId: userId, email: row.email, deletedAt: null },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.customer.create({
          data: {
            ownerId: userId,
            name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            status: row.status || 'LEAD',
            source: row.source || null,
            industry: row.industry || null,
            website: row.website || null,
          },
        });
        results.created++;
      } catch (err: any) {
        results.errors.push(`Row ${row.name}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Imported ${results.created} customers, ${results.skipped} skipped`,
    });
  } catch (error) {
    logger.error('Error importing customers:', error);
    res.status(500).json({ success: false, message: 'Failed to import customers' });
  }
};
