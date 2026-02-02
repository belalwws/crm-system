import { Response } from 'express';
import Customer from '../models/Customer';
import Deal from '../models/Deal';
import Task from '../models/Task';
import { AuthRequest } from '../types';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get counts
    const [
      totalCustomers,
      activeCustomers,
      totalDeals,
      totalTasks,
      pendingTasks,
    ] = await Promise.all([
      Customer.countDocuments({ owner: userId }),
      Customer.countDocuments({ owner: userId, status: 'active' }),
      Deal.countDocuments({ owner: userId }),
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'pending' }),
    ]);

    // Get total deal value
    const dealStats = await Deal.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
          wonDeals: {
            $sum: { $cond: [{ $eq: ['$stage', 'closed-won'] }, 1, 0] },
          },
          wonValue: {
            $sum: {
              $cond: [{ $eq: ['$stage', 'closed-won'] }, '$value', 0],
            },
          },
        },
      },
    ]);

    const dealData = dealStats[0] || {
      totalValue: 0,
      wonDeals: 0,
      wonValue: 0,
    };

    // Get deals by stage
    const dealsByStage = await Deal.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
    ]);

    // Get recent activities (tasks)
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('deal', 'title');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          activeCustomers,
          totalDeals,
          totalTasks,
          pendingTasks,
          totalDealValue: dealData.totalValue,
          wonDeals: dealData.wonDeals,
          wonValue: dealData.wonValue,
        },
        dealsByStage,
        recentTasks,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard statistics',
    });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/activities
 * @access  Private
 */
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await Task.find({ assignedTo: req.user?.id })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('customer', 'name email')
      .populate('deal', 'title value');

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching activities',
    });
  }
};
