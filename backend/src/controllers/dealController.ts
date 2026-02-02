import { Response } from 'express';
import Deal from '../models/Deal';
import { AuthRequest } from '../types';

/**
 * @desc    Get all deals
 * @route   GET /api/deals
 * @access  Private
 */
export const getDeals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deals = await Deal.find({ owner: req.user?.id })
      .sort({ createdAt: -1 })
      .populate('customer', 'name email company')
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deals',
    });
  }
};

/**
 * @desc    Get single deal
 * @route   GET /api/deals/:id
 * @access  Private
 */
export const getDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    })
      .populate('customer', 'name email company')
      .populate('owner', 'name email');

    if (!deal) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: deal,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deal',
    });
  }
};

/**
 * @desc    Create new deal
 * @route   POST /api/deals
 * @access  Private
 */
export const createDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    req.body.owner = req.user?.id;

    const deal = await Deal.create(req.body);

    res.status(201).json({
      success: true,
      data: deal,
      message: 'Deal created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating deal',
    });
  }
};

/**
 * @desc    Update deal
 * @route   PUT /api/deals/:id
 * @access  Private
 */
export const updateDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let deal = await Deal.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    });

    if (!deal) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: deal,
      message: 'Deal updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating deal',
    });
  }
};

/**
 * @desc    Delete deal
 * @route   DELETE /api/deals/:id
 * @access  Private
 */
export const deleteDeal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      owner: req.user?.id,
    });

    if (!deal) {
      res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
      return;
    }

    await deal.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Deal deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting deal',
    });
  }
};

/**
 * @desc    Get deals statistics
 * @route   GET /api/deals/stats
 * @access  Private
 */
export const getDealStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await Deal.aggregate([
      { $match: { owner: req.user?.id } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching deal statistics',
    });
  }
};
