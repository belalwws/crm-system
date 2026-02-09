import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { CustomerStatus } from '@prisma/client';
import { createAuditLog, createTimelineEvent, computeDiff } from '../lib/auditLog';
import { evaluateWorkflows, fireWebhooks } from '../lib/workflowEngine';

/**
 * Helper: Map frontend status to Prisma enum
 */
const mapStatus = (status?: string): CustomerStatus => {
  const statusMap: Record<string, CustomerStatus> = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    lead: 'LEAD',
  };
  return statusMap[status?.toLowerCase() || 'lead'] || 'LEAD';
};

/**
 * Helper: Map Prisma status to frontend format
 */
const formatCustomer = (customer: any) => ({
  ...customer,
  _id: customer.id,
  status: customer.status.toLowerCase(),
  owner: customer.owner,
});

/**
 * @desc    Get all customers (with search, filters, pagination)
 * @route   GET /api/customers
 * @access  Private (Multi-tenant: user sees only their customers)
 */
export const getCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search, status, source, industry, tags,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = '1', limit = '50',
      includeDeleted,
    } = req.query as Record<string, string>;

    // Build where clause
    const where: any = {
      ownerId: req.user?.id,
      ...(includeDeleted !== 'true' && { deletedAt: null }),
    };

    // Text search across name, email, company, phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = mapStatus(status);
    if (source) where.source = source;
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };
    if (tags) where.tags = { hasSome: tags.split(',') };

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { deals: true, tasks: true, notes: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      data: customers.map(formatCustomer),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customers',
    });
  }
};

/**
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private (Multi-tenant)
 */
export const getCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { deals: true, tasks: true, notes: true, meetings: true, documents: true } },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatCustomer(customer),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer',
    });
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private (Multi-tenant: assigned to current user)
 */
export const createCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phone, company, address, status, tags, notes, source, industry, website } = req.body;

    // Duplicate detection: check by email or phone
    const duplicates = await prisma.customer.findMany({
      where: {
        ownerId: req.user?.id as string,
        deletedAt: null,
        OR: [
          ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        status: mapStatus(status),
        source: source || undefined,
        industry,
        website,
        tags: tags || [],
        notesText: notes,
        ownerId: req.user?.id as string,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log
    await createAuditLog({
      userId: req.user?.id as string,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      entityName: customer.name,
      newValues: { name, email, phone, company, status },
    });

    // Timeline event
    await createTimelineEvent({
      ownerId: req.user?.id as string,
      type: 'SYSTEM',
      title: `Customer "${name}" created`,
      customerId: customer.id,
    });

    // Fire webhooks
    fireWebhooks(req.user?.id as string, 'customer.created', { customer: formatCustomer(customer) });

    // Evaluate workflows
    evaluateWorkflows({
      userId: req.user?.id as string,
      entityType: 'Customer',
      entityId: customer.id,
      trigger: 'CUSTOMER_CREATED',
      newData: customer as any,
    });

    res.status(201).json({
      success: true,
      data: formatCustomer(customer),
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      message: duplicates.length > 0
        ? `Customer created. Warning: ${duplicates.length} potential duplicate(s) found.`
        : 'Customer created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating customer',
    });
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Multi-tenant)
 */
export const updateCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // First check if customer exists and belongs to user
    const existing = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    const { name, email, phone, company, address, status, tags, notes, source, industry, website } = req.body;

    const updateData: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(address !== undefined && { address }),
      ...(status && { status: mapStatus(status) }),
      ...(tags && { tags }),
      ...(notes !== undefined && { notesText: notes }),
      ...(source !== undefined && { source: source || null }),
      ...(industry !== undefined && { industry }),
      ...(website !== undefined && { website }),
    };

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Compute diff for audit log
    const diff = computeDiff(existing as any, customer as any, [
      'name', 'email', 'phone', 'company', 'address', 'status', 'tags', 'source', 'industry', 'website',
    ]);

    if (diff) {
      await createAuditLog({
        userId: req.user?.id as string,
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: customer.id,
        entityName: customer.name,
        oldValues: diff.oldValues,
        newValues: diff.newValues,
      });
    }

    // Track status change on timeline
    if (status && mapStatus(status) !== existing.status) {
      await createTimelineEvent({
        ownerId: req.user?.id as string,
        type: 'STATUS_CHANGED',
        title: `Status changed from ${existing.status} to ${mapStatus(status)}`,
        metadata: { oldStatus: existing.status, newStatus: mapStatus(status) },
        customerId: customer.id,
      });

      // Evaluate workflows for status change
      evaluateWorkflows({
        userId: req.user?.id as string,
        entityType: 'Customer',
        entityId: customer.id,
        trigger: 'CUSTOMER_STATUS_CHANGED',
        oldData: existing as any,
        newData: customer as any,
      });
    }

    fireWebhooks(req.user?.id as string, 'customer.updated', { customer: formatCustomer(customer) });

    res.status(200).json({
      success: true,
      data: formatCustomer(customer),
      message: 'Customer updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating customer',
    });
  }
};

/**
 * @desc    Soft delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Multi-tenant)
 */
export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    // Soft delete
    await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        deletedById: req.user?.id,
      },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: existing.id,
      entityName: existing.name,
    });

    fireWebhooks(req.user?.id as string, 'customer.deleted', { customerId: existing.id, name: existing.name });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Customer deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting customer',
    });
  }
};

/**
 * @desc    Restore soft-deleted customer
 * @route   POST /api/customers/:id/restore
 * @access  Private
 */
export const restoreCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
        deletedAt: { not: null },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Deleted customer not found' });
      return;
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { deletedAt: null, deletedById: null },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'RESTORE',
      entityType: 'Customer',
      entityId: customer.id,
      entityName: customer.name,
    });

    res.status(200).json({
      success: true,
      data: formatCustomer(customer),
      message: 'Customer restored successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error restoring customer' });
  }
};

/**
 * @desc    Check for duplicate customers
 * @route   POST /api/customers/check-duplicates
 * @access  Private
 */
export const checkDuplicates = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, phone, name } = req.body;
    const conditions: any[] = [];

    if (email) conditions.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) conditions.push({ phone });
    if (name) conditions.push({ name: { contains: name, mode: 'insensitive' } });

    if (conditions.length === 0) {
      res.status(200).json({ success: true, duplicates: [] });
      return;
    }

    const duplicates = await prisma.customer.findMany({
      where: {
        ownerId: req.user?.id,
        deletedAt: null,
        OR: conditions,
      },
      select: { id: true, name: true, email: true, phone: true, company: true, status: true },
      take: 10,
    });

    res.status(200).json({ success: true, duplicates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking duplicates' });
  }
};

/**
 * @desc    Merge two customers
 * @route   POST /api/customers/merge
 * @access  Private
 */
export const mergeCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { primaryId, secondaryId } = req.body;
    if (!primaryId || !secondaryId) {
      res.status(400).json({ success: false, message: 'primaryId and secondaryId are required' });
      return;
    }

    const [primary, secondary] = await Promise.all([
      prisma.customer.findFirst({ where: { id: primaryId, ownerId: req.user?.id, deletedAt: null } }),
      prisma.customer.findFirst({ where: { id: secondaryId, ownerId: req.user?.id, deletedAt: null } }),
    ]);

    if (!primary || !secondary) {
      res.status(404).json({ success: false, message: 'One or both customers not found' });
      return;
    }

    // Move all relations from secondary to primary
    await prisma.$transaction([
      prisma.deal.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.task.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.note.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.emailLog.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.document.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.meeting.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      prisma.timelineEvent.updateMany({ where: { customerId: secondaryId }, data: { customerId: primaryId } }),
      // Merge tags
      prisma.customer.update({
        where: { id: primaryId },
        data: {
          tags: [...new Set([...primary.tags, ...secondary.tags])],
          phone: primary.phone || secondary.phone,
          company: primary.company || secondary.company,
          address: primary.address || secondary.address,
          industry: (primary as any).industry || (secondary as any).industry,
          website: (primary as any).website || (secondary as any).website,
        },
      }),
      // Soft delete the secondary
      prisma.customer.update({
        where: { id: secondaryId },
        data: { deletedAt: new Date(), deletedById: req.user?.id },
      }),
    ]);

    await createAuditLog({
      userId: req.user?.id as string,
      action: 'MERGE',
      entityType: 'Customer',
      entityId: primaryId,
      entityName: primary.name,
      oldValues: { mergedFrom: secondaryId, mergedName: secondary.name },
      newValues: { mergedInto: primaryId },
    });

    await createTimelineEvent({
      ownerId: req.user?.id as string,
      type: 'SYSTEM',
      title: `Merged with "${secondary.name}"`,
      description: `Customer "${secondary.name}" was merged into this record`,
      customerId: primaryId,
    });

    const merged = await prisma.customer.findUnique({
      where: { id: primaryId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    res.status(200).json({
      success: true,
      data: formatCustomer(merged),
      message: `"${secondary.name}" merged into "${primary.name}" successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error merging customers' });
  }
};
