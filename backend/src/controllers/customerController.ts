import { Response } from 'express';
import Customer from '../models/Customer';
import { AuthRequest } from '../types';

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
export const getCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customers = await Customer.find({ owner: req.user?.id })
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
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
 * @access  Private
 */
export const getCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    }).populate('owner', 'name email');

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer,
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
 * @access  Private
 */
export const createCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Add owner to req.body
    req.body.owner = req.user?.id;

    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer,
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
 * @access  Private
 */
export const updateCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let customer = await Customer.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: customer,
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
 * @access  Private
 */
export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    await customer.deleteOne();

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
