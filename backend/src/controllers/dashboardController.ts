import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

/**
 * Helper: Format stage for frontend
 */
const formatStage = (stage: string): string => {
  return stage.toLowerCase().replace('_', '-');
};

/**
 * Helper: Format task for frontend
 */
const formatTask = (task: any) => ({
  ...task,
  _id: task.id,
  type: task.type.toLowerCase().replace('_', '-'),
  priority: task.priority.toLowerCase(),
  status: task.status.toLowerCase().replace('_', '-'),
  customer: task.customer ? { ...task.customer, _id: task.customer.id } : null,
  deal: task.deal ? { ...task.deal, _id: task.deal.id } : null,
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (Multi-tenant)
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get counts in parallel
    const [
      totalCustomers,
      activeCustomers,
      totalDeals,
      totalTasks,
      pendingTasks,
      dealAggregates,
      dealsByStage,
      recentTasks,
    ] = await Promise.all([
      prisma.customer.count({ where: { ownerId: userId } }),
      prisma.customer.count({ where: { ownerId: userId, status: 'ACTIVE' } }),
      prisma.deal.count({ where: { ownerId: userId } }),
      prisma.task.count({ where: { assignedToId: userId } }),
      prisma.task.count({ where: { assignedToId: userId, status: 'PENDING' } }),
      // Deal aggregates
      prisma.deal.aggregate({
        where: { ownerId: userId },
        _sum: { value: true },
      }),
      // Deals by stage
      prisma.deal.groupBy({
        by: ['stage'],
        where: { ownerId: userId },
        _count: { id: true },
        _sum: { value: true },
      }),
      // Recent tasks
      prisma.task.findMany({
        where: { assignedToId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
    ]);

    // Get won deals stats
    const wonDealsStats = await prisma.deal.aggregate({
      where: { ownerId: userId, stage: 'CLOSED_WON' },
      _count: { id: true },
      _sum: { value: true },
    });

    // Format deals by stage
    const formattedDealsByStage = dealsByStage.map((s) => ({
      _id: formatStage(s.stage),
      count: s._count.id,
      value: s._sum.value || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          activeCustomers,
          totalDeals,
          totalTasks,
          pendingTasks,
          totalDealValue: dealAggregates._sum.value || 0,
          wonDeals: wonDealsStats._count.id || 0,
          wonValue: wonDealsStats._sum.value || 0,
        },
        dealsByStage: formattedDealsByStage,
        recentTasks: recentTasks.map(formatTask),
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
 * @access  Private (Multi-tenant)
 */
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await prisma.task.findMany({
      where: { assignedToId: req.user?.id },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: activities.map(formatTask),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching activities',
    });
  }
};
