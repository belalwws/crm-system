import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { CustomerStatus } from '@prisma/client';

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
  _id: customer.id, // للتوافق مع الـ Frontend
  status: customer.status.toLowerCase(),
  owner: customer.owner,
});

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private (Multi-tenant: user sees only their customers)
 */
export const getCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      where: { ownerId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: customers.length,
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
        ownerId: req.user?.id, // Multi-tenant filter
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
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
    const { name, email, phone, company, address, status, tags, notes } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        status: mapStatus(status),
        tags: tags || [],
        notesText: notes,
        ownerId: req.user?.id as string, // Multi-tenant: assign to current user
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: formatCustomer(customer),
      message: 'Customer created successfully',
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
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    const { name, email, phone, company, address, status, tags, notes } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(address !== undefined && { address }),
        ...(status && { status: mapStatus(status) }),
        ...(tags && { tags }),
        ...(notes !== undefined && { notesText: notes }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

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
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Multi-tenant)
 */
export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // First check if customer exists and belongs to user
    const existing = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user?.id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    await prisma.customer.delete({
      where: { id: req.params.id },
    });

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
