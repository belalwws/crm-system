import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

const EXPORT_BATCH_SIZE = 1000;

/**
 * Helper: Stream CSV rows in batches
 */
const streamCSV = async <T extends { id: string }>(
  res: Response,
  headers: string[],
  fetchBatch: (cursor?: string) => Promise<T[]>,
  rowMapper: (item: T) => string[]
) => {
  res.setHeader('Content-Type', 'text/csv');
  res.write(headers.join(',') + '\n');

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const batch = await fetchBatch(cursor);
    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of batch) {
      const row = rowMapper(item).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      res.write(row + '\n');
    }

    cursor = batch[batch.length - 1].id;
    hasMore = batch.length === EXPORT_BATCH_SIZE;
  }

  res.end();
};

/**
 * Export customers as CSV (streaming)
 */
export const exportCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Industry', 'Website', 'Created At'];

    await streamCSV(
      res,
      headers,
      async (cursor) => prisma.customer.findMany({
        where: { ownerId: userId, deletedAt: null },
        orderBy: { id: 'asc' },
        take: EXPORT_BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      (c) => [
        c.name, c.email, c.phone || '', c.company || '', c.status,
        c.source || '', c.industry || '', c.website || '',
        c.createdAt.toISOString(),
      ]
    );
  } catch (error) {
    logger.error('Error exporting customers:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export customers' });
    }
  }
};

/**
 * Export deals as CSV (streaming)
 */
export const exportDeals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    res.setHeader('Content-Disposition', 'attachment; filename=deals.csv');

    const headers = ['Title', 'Customer', 'Value', 'Stage', 'Probability', 'Expected Close', 'Created At'];

    await streamCSV(
      res,
      headers,
      async (cursor) => prisma.deal.findMany({
        where: { ownerId: userId, deletedAt: null },
        include: { customer: { select: { name: true } } },
        orderBy: { id: 'asc' },
        take: EXPORT_BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      (d) => [
        d.title, d.customer.name, d.value.toString(), d.stage,
        d.probability.toString(), d.expectedCloseDate?.toISOString() || '',
        d.createdAt.toISOString(),
      ]
    );
  } catch (error) {
    logger.error('Error exporting deals:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export deals' });
    }
  }
};

/**
 * Export tasks as CSV (streaming)
 */
export const exportTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');

    const headers = ['Title', 'Type', 'Priority', 'Status', 'Due Date', 'Customer', 'Deal', 'Created At'];

    await streamCSV(
      res,
      headers,
      async (cursor) => prisma.task.findMany({
        where: { assignedToId: userId, deletedAt: null },
        include: {
          customer: { select: { name: true } },
          deal: { select: { title: true } },
        },
        orderBy: { id: 'asc' },
        take: EXPORT_BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      (t) => [
        t.title, t.type, t.priority, t.status,
        t.dueDate?.toISOString() || '', t.customer?.name || '', t.deal?.title || '',
        t.createdAt.toISOString(),
      ]
    );
  } catch (error) {
    logger.error('Error exporting tasks:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export tasks' });
    }
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
