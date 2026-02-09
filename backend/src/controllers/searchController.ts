import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

/**
 * @desc    Global search across customers, deals, tasks
 * @route   GET /api/search?q=...
 * @access  Private
 */
export const globalSearch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { q, entity, limit = '10' } = req.query as Record<string, string>;

    if (!q || q.length < 2) {
      res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
      return;
    }

    const maxResults = Math.min(50, parseInt(limit));
    const results: any = {};

    // Search customers (unless entity is specified and it's not customers)
    if (!entity || entity === 'customers') {
      results.customers = await prisma.customer.findMany({
        where: {
          ownerId: req.user?.id,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, company: true, status: true },
        take: maxResults,
      });
    }

    // Search deals
    if (!entity || entity === 'deals') {
      results.deals = await prisma.deal.findMany({
        where: {
          ownerId: req.user?.id,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, value: true, stage: true },
        take: maxResults,
      });
    }

    // Search tasks
    if (!entity || entity === 'tasks') {
      results.tasks = await prisma.task.findMany({
        where: {
          assignedToId: req.user?.id,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        take: maxResults,
      });
    }

    // Count total
    const totalResults = Object.values(results).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);

    res.status(200).json({
      success: true,
      query: q,
      totalResults,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Search error' });
  }
};

/**
 * @desc    Get saved views
 * @route   GET /api/saved-views?entity=customers
 * @access  Private
 */
export const getSavedViews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { entity } = req.query as Record<string, string>;
    const where: any = { ownerId: req.user?.id };
    if (entity) where.entity = entity;

    const views = await prisma.savedView.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({ success: true, data: views });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching saved views' });
  }
};

/**
 * @desc    Create saved view
 * @route   POST /api/saved-views
 * @access  Private
 */
export const createSavedView = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, entity, filters, sorting, columns, isDefault, color, icon } = req.body;

    if (!name || !entity || !filters) {
      res.status(400).json({ success: false, message: 'name, entity, and filters are required' });
      return;
    }

    // If setting as default, unset other defaults for this entity
    if (isDefault) {
      await prisma.savedView.updateMany({
        where: { ownerId: req.user?.id, entity, isDefault: true },
        data: { isDefault: false },
      });
    }

    const view = await prisma.savedView.create({
      data: {
        ownerId: req.user?.id as string,
        name,
        entity,
        filters,
        sorting: sorting || undefined,
        columns: columns || undefined,
        isDefault: isDefault || false,
        color,
        icon,
      },
    });

    res.status(201).json({ success: true, data: view });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating saved view' });
  }
};

/**
 * @desc    Update saved view
 * @route   PUT /api/saved-views/:id
 * @access  Private
 */
export const updateSavedView = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.savedView.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Saved view not found' });
      return;
    }

    const { name, filters, sorting, columns, isDefault, color, icon } = req.body;

    if (isDefault) {
      await prisma.savedView.updateMany({
        where: { ownerId: req.user?.id, entity: existing.entity, isDefault: true, id: { not: existing.id } },
        data: { isDefault: false },
      });
    }

    const view = await prisma.savedView.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(filters && { filters }),
        ...(sorting !== undefined && { sorting }),
        ...(columns !== undefined && { columns }),
        ...(isDefault !== undefined && { isDefault }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
      },
    });

    res.status(200).json({ success: true, data: view });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating saved view' });
  }
};

/**
 * @desc    Delete saved view
 * @route   DELETE /api/saved-views/:id
 * @access  Private
 */
export const deleteSavedView = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.savedView.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Saved view not found' });
      return;
    }

    await prisma.savedView.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Saved view deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting saved view' });
  }
};
