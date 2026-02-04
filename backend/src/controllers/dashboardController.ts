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
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

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
      // New customers this month
      newCustomersThisMonth,
      newCustomersLastMonth,
      // Deals this month vs last month
      dealsThisMonth,
      dealsLastMonth,
      wonDealsThisMonth,
      wonDealsLastMonth,
      // Monthly deal data for chart
      monthlyDeals,
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
      // New customers this month
      prisma.customer.count({
        where: { ownerId: userId, createdAt: { gte: startOfMonth } },
      }),
      // New customers last month
      prisma.customer.count({
        where: { ownerId: userId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      // Deals value this month
      prisma.deal.aggregate({
        where: { ownerId: userId, createdAt: { gte: startOfMonth } },
        _sum: { value: true },
        _count: { id: true },
      }),
      // Deals value last month
      prisma.deal.aggregate({
        where: { ownerId: userId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { value: true },
        _count: { id: true },
      }),
      // Won deals this month
      prisma.deal.aggregate({
        where: { ownerId: userId, stage: 'CLOSED_WON', updatedAt: { gte: startOfMonth } },
        _sum: { value: true },
        _count: { id: true },
      }),
      // Won deals last month
      prisma.deal.aggregate({
        where: { ownerId: userId, stage: 'CLOSED_WON', updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { value: true },
        _count: { id: true },
      }),
      // Get all deals from start of year for monthly chart
      prisma.deal.findMany({
        where: { ownerId: userId, createdAt: { gte: startOfYear } },
        select: { createdAt: true, value: true, stage: true },
      }),
    ]);

    // Get won deals stats (total)
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

    // Calculate monthly data for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthDeals = monthlyDeals.filter(d => d.createdAt.getMonth() === index);
      const totalValue = monthDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      return {
        month,
        value: totalValue,
        count: monthDeals.length,
      };
    });

    // Calculate percentage changes
    const earningsChangePercent = wonDealsLastMonth._sum.value 
      ? Math.round(((wonDealsThisMonth._sum.value || 0) - (wonDealsLastMonth._sum.value || 0)) / (wonDealsLastMonth._sum.value || 1) * 100)
      : (wonDealsThisMonth._sum.value || 0) > 0 ? 100 : 0;

    const pipelineChangePercent = dealsLastMonth._sum.value
      ? Math.round(((dealsThisMonth._sum.value || 0) - (dealsLastMonth._sum.value || 0)) / (dealsLastMonth._sum.value || 1) * 100)
      : (dealsThisMonth._sum.value || 0) > 0 ? 100 : 0;

    const customersChangePercent = newCustomersLastMonth
      ? Math.round((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth * 100)
      : newCustomersThisMonth > 0 ? 100 : 0;

    const newCustomersPercent = totalCustomers > 0 
      ? Math.round((newCustomersThisMonth / totalCustomers) * 100)
      : 0;

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
          // New fields for dashboard
          earningsThisMonth: wonDealsThisMonth._sum.value || 0,
          earningsChangePercent,
          pipelineThisMonth: dealsThisMonth._sum.value || 0,
          pipelineChangePercent,
          dealsThisMonth: dealsThisMonth._count.id || 0,
          customersChangePercent,
          newCustomersThisMonth,
          newCustomersPercent,
        },
        dealsByStage: formattedDealsByStage,
        recentTasks: recentTasks.map(formatTask),
        monthlyData,
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
