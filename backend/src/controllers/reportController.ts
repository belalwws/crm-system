import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

/**
 * @desc    Get conversion funnel data
 * @route   GET /api/reports/funnel
 * @access  Private
 */
export const getConversionFunnel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await prisma.deal.groupBy({
      by: ['stage'],
      where: { ownerId: req.user?.id, deletedAt: null },
      _count: { id: true },
      _sum: { value: true },
      _avg: { value: true },
    });

    const stageOrder = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const funnel = stageOrder.map((stage) => {
      const stat = stats.find((s) => s.stage === stage);
      return {
        stage: stage.toLowerCase().replace('_', '-'),
        count: stat?._count.id || 0,
        totalValue: Number(stat?._sum.value) || 0,
        avgValue: Math.round(Number(stat?._avg.value) || 0),
      };
    });

    // Calculate conversion rates
    const funnelWithRates = funnel.map((item, index) => {
      const prevCount = index > 0 ? funnel[index - 1].count : item.count;
      return {
        ...item,
        conversionRate: prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0,
      };
    });

    res.status(200).json({ success: true, data: funnelWithRates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching funnel' });
  }
};

/**
 * @desc    Get deal aging report
 * @route   GET /api/reports/aging
 * @access  Private
 */
export const getDealAging = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deals = await prisma.deal.findMany({
      where: {
        ownerId: req.user?.id,
        deletedAt: null,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const aging = deals.map((deal) => {
      const daysOpen = Math.floor((now.getTime() - deal.createdAt.getTime()) / 86400000);
      const daysSinceUpdate = Math.floor((now.getTime() - deal.updatedAt.getTime()) / 86400000);
      return {
        ...deal,
        stage: deal.stage.toLowerCase().replace('_', '-'),
        daysOpen,
        daysSinceUpdate,
        isStale: daysSinceUpdate > 14,
        riskLevel: daysSinceUpdate > 30 ? 'high' : daysSinceUpdate > 14 ? 'medium' : 'low',
      };
    });

    // Summary by stage
    const stages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
    const summary = stages.map((stage) => {
      const stageDeals = aging.filter((d) => d.stage === stage.toLowerCase().replace('_', '-'));
      const avgDays = stageDeals.length > 0
        ? Math.round(stageDeals.reduce((sum, d) => sum + d.daysOpen, 0) / stageDeals.length)
        : 0;
      return {
        stage: stage.toLowerCase().replace('_', '-'),
        count: stageDeals.length,
        avgDaysOpen: avgDays,
        staleCount: stageDeals.filter((d) => d.isStale).length,
      };
    });

    res.status(200).json({ success: true, data: { deals: aging, summary } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching aging report' });
  }
};

/**
 * @desc    Get revenue forecast
 * @route   GET /api/reports/forecast
 * @access  Private
 */
export const getRevenueForecast = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deals = await prisma.deal.findMany({
      where: {
        ownerId: req.user?.id,
        deletedAt: null,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      select: {
        id: true,
        title: true,
        value: true,
        probability: true,
        stage: true,
        expectedCloseDate: true,
        customer: { select: { name: true } },
      },
    });

    // Weighted forecast: value * probability / 100
    const forecasted = deals.map((deal) => ({
      ...deal,
      stage: deal.stage.toLowerCase().replace('_', '-'),
      weightedValue: Math.round(Number(deal.value) * deal.probability / 100),
    }));

    // Group by month
    const byMonth: Record<string, { totalValue: number; weightedValue: number; count: number }> = {};
    for (const deal of forecasted) {
      const month = deal.expectedCloseDate
        ? deal.expectedCloseDate.toISOString().slice(0, 7)
        : 'unscheduled';
      if (!byMonth[month]) byMonth[month] = { totalValue: 0, weightedValue: 0, count: 0 };
      byMonth[month].totalValue += Number(deal.value);
      byMonth[month].weightedValue += deal.weightedValue;
      byMonth[month].count++;
    }

    const totalPipeline = deals.reduce((sum, d) => sum + Number(d.value), 0);
    const weightedPipeline = forecasted.reduce((sum, d) => sum + d.weightedValue, 0);

    // Won deals this quarter
    const quarterStart = new Date();
    quarterStart.setMonth(quarterStart.getMonth() - (quarterStart.getMonth() % 3), 1);
    quarterStart.setHours(0, 0, 0, 0);

    const wonThisQuarter = await prisma.deal.aggregate({
      where: {
        ownerId: req.user?.id,
        stage: 'CLOSED_WON',
        closedDate: { gte: quarterStart },
      },
      _sum: { value: true },
      _count: { id: true },
    });

    res.status(200).json({
      success: true,
      data: {
        deals: forecasted,
        byMonth: Object.entries(byMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data })),
        summary: {
          totalPipeline,
          weightedPipeline,
          dealCount: deals.length,
          wonThisQuarter: wonThisQuarter._sum.value || 0,
          wonCountThisQuarter: wonThisQuarter._count.id,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching forecast' });
  }
};

/**
 * @desc    Get performance metrics
 * @route   GET /api/reports/performance
 * @access  Private
 */
export const getPerformanceMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { days = '30' } = req.query as Record<string, string>;
    const since = new Date(Date.now() - parseInt(days) * 86400000);

    const [
      dealsCreated,
      dealsWon,
      dealsLost,
      tasksCompleted,
      tasksCreated,
      customersAdded,
      emailsSent,
    ] = await Promise.all([
      prisma.deal.count({ where: { ownerId: req.user?.id, createdAt: { gte: since } } }),
      prisma.deal.count({ where: { ownerId: req.user?.id, stage: 'CLOSED_WON', closedDate: { gte: since } } }),
      prisma.deal.count({ where: { ownerId: req.user?.id, stage: 'CLOSED_LOST', closedDate: { gte: since } } }),
      prisma.task.count({ where: { assignedToId: req.user?.id, status: 'COMPLETED', completedDate: { gte: since } } }),
      prisma.task.count({ where: { assignedToId: req.user?.id, createdAt: { gte: since } } }),
      prisma.customer.count({ where: { ownerId: req.user?.id, createdAt: { gte: since } } }),
      prisma.emailLog.count({ where: { ownerId: req.user?.id, sentAt: { gte: since } } }),
    ]);

    const wonValue = await prisma.deal.aggregate({
      where: { ownerId: req.user?.id, stage: 'CLOSED_WON', closedDate: { gte: since } },
      _sum: { value: true },
    });

    const winRate = (dealsWon + dealsLost) > 0
      ? Math.round((dealsWon / (dealsWon + dealsLost)) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        dealsCreated,
        dealsWon,
        dealsLost,
        winRate,
        revenue: wonValue._sum.value || 0,
        tasksCompleted,
        tasksCreated,
        taskCompletionRate: tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0,
        customersAdded,
        emailsSent,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching performance' });
  }
};

/**
 * @desc    Get activity heatmap (deals/tasks by day)
 * @route   GET /api/reports/activity-heatmap
 * @access  Private
 */
export const getActivityHeatmap = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { days = '90' } = req.query as Record<string, string>;
    const since = new Date(Date.now() - parseInt(days) * 86400000);

    const activities = await prisma.activity.findMany({
      where: { ownerId: req.user?.id, createdAt: { gte: since } },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const heatmap: Record<string, number> = {};
    for (const activity of activities) {
      const date = activity.createdAt.toISOString().slice(0, 10);
      heatmap[date] = (heatmap[date] || 0) + 1;
    }

    res.status(200).json({
      success: true,
      data: Object.entries(heatmap).map(([date, count]) => ({ date, count })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching heatmap' });
  }
};
