import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import {
  aiChat,
  aiComposeEmail,
  aiCustomerInsights,
  aiDealAnalysis,
  aiTaskPrioritization,
  aiSummarize,
  aiDashboardInsights,
  ChatMessage,
} from '../lib/ai';

/**
 * @desc    AI Chat - General CRM Assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, context, conversationHistory } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    // Build CRM context from user's data
    let crmContext = context || '';
    
    if (!context) {
      const [customerCount, dealCount, taskCount] = await Promise.all([
        prisma.customer.count({ where: { ownerId: req.user?.id } }),
        prisma.deal.count({ where: { ownerId: req.user?.id } }),
        prisma.task.count({ where: { assignedToId: req.user?.id, status: { not: 'COMPLETED' } } }),
      ]);
      
      crmContext = `User has ${customerCount} customers, ${dealCount} deals, and ${taskCount} active tasks.`;
    }

    const result = await aiChat(message, crmContext, conversationHistory as ChatMessage[]);

    res.status(200).json({
      success: true,
      data: {
        message: result.content,
        model: result.model,
        usage: result.usage,
      },
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Email Composer
 * @route   POST /api/ai/compose-email
 * @access  Private
 */
export const composeEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, purpose, tone, additionalContext } = req.body;

    if (!purpose) {
      res.status(400).json({ success: false, message: 'Purpose is required' });
      return;
    }

    let customerName = 'Customer';
    let customerCompany = '';
    let dealInfo = '';

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, ownerId: req.user?.id },
        include: {
          deals: { where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } }, take: 1 },
        },
      });

      if (customer) {
        customerName = customer.name;
        customerCompany = customer.company || '';
        if (customer.deals.length > 0) {
          const deal = customer.deals[0];
          dealInfo = `Active deal: "${deal.title}" worth $${deal.value} at ${deal.stage} stage`;
        }
      }
    }

    const result = await aiComposeEmail({
      customerName,
      customerCompany,
      purpose,
      tone,
      additionalContext,
      dealInfo,
    });

    res.status(200).json({
      success: true,
      data: {
        email: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Email Composer Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Customer Insights
 * @route   GET /api/ai/customer-insights/:customerId
 * @access  Private
 */
export const customerInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, ownerId: req.user?.id },
      include: {
        deals: { select: { title: true, value: true, stage: true } },
        tasks: { select: { title: true, status: true, priority: true } },
        notes: {
          select: { content: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const lastActivity = await prisma.activity.findFirst({
      where: { ownerId: req.user?.id, entityId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    const result = await aiCustomerInsights({
      name: customer.name,
      email: customer.email,
      company: customer.company || undefined,
      status: customer.status,
      deals: customer.deals.map(d => ({
        title: d.title,
        value: d.value,
        stage: d.stage,
      })),
      tasks: customer.tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      })),
      notes: customer.notes.map(n => ({
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
      lastActivity: lastActivity?.createdAt.toISOString(),
    });

    res.status(200).json({
      success: true,
      data: {
        insights: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Customer Insights Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Deal Analysis
 * @route   GET /api/ai/deal-analysis/:dealId
 * @access  Private
 */
export const dealAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, ownerId: req.user?.id },
      include: {
        customer: { select: { name: true, company: true } },
        tasks: { select: { title: true, status: true } },
        notes: { select: { content: true }, take: 5 },
      },
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    const daysSinceCreated = Math.floor(
      (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = await aiDealAnalysis({
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate?.toISOString(),
      customerName: deal.customer.name,
      customerCompany: deal.customer.company || undefined,
      daysSinceCreated,
      notes: deal.notes.map(n => n.content),
      tasks: deal.tasks.map(t => ({ title: t.title, status: t.status })),
    });

    res.status(200).json({
      success: true,
      data: {
        analysis: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Deal Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Task Prioritization
 * @route   GET /api/ai/prioritize-tasks
 * @access  Private
 */
export const prioritizeTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: req.user?.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        customer: { select: { name: true } },
        deal: { select: { title: true, value: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    if (tasks.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          prioritization: 'No pending tasks found. Great job keeping things organized! 🎉',
          model: 'none',
        },
      });
      return;
    }

    const result = await aiTaskPrioritization(
      tasks.map(t => ({
        title: t.title,
        description: t.description || undefined,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate?.toISOString(),
        customerName: t.customer?.name,
        dealTitle: t.deal?.title,
        dealValue: t.deal?.value,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        prioritization: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Task Prioritization Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Summarize
 * @route   POST /api/ai/summarize
 * @access  Private
 */
export const summarize = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, entityId } = req.body;

    if (!type || !entityId) {
      res.status(400).json({ success: false, message: 'Type and entityId are required' });
      return;
    }

    let data = '';

    switch (type) {
      case 'customer': {
        const customer = await prisma.customer.findFirst({
          where: { id: entityId, ownerId: req.user?.id },
          include: {
            notes: { orderBy: { createdAt: 'desc' }, take: 20 },
            deals: true,
            meetings: { orderBy: { startTime: 'desc' }, take: 10 },
          },
        });
        if (!customer) {
          res.status(404).json({ success: false, message: 'Customer not found' });
          return;
        }
        data = `Customer: ${customer.name} (${customer.company || 'No company'})
Status: ${customer.status}
Deals: ${customer.deals.map(d => `${d.title} - $${d.value} (${d.stage})`).join('; ')}
Notes: ${customer.notes.map(n => n.content).join('\n---\n')}
Meetings: ${customer.meetings.map(m => `${m.title} on ${m.startTime.toISOString()} - ${m.description || 'No description'}`).join('\n')}`;
        break;
      }
      case 'deal': {
        const deal = await prisma.deal.findFirst({
          where: { id: entityId, ownerId: req.user?.id },
          include: {
            customer: true,
            notes: { orderBy: { createdAt: 'desc' }, take: 20 },
            tasks: true,
          },
        });
        if (!deal) {
          res.status(404).json({ success: false, message: 'Deal not found' });
          return;
        }
        data = `Deal: ${deal.title}
Value: $${deal.value}
Stage: ${deal.stage}
Customer: ${deal.customer.name}
Notes: ${deal.notes.map(n => n.content).join('\n---\n')}
Tasks: ${deal.tasks.map(t => `${t.title} (${t.status})`).join(', ')}`;
        break;
      }
      default:
        res.status(400).json({ success: false, message: 'Invalid type. Use: customer, deal' });
        return;
    }

    const result = await aiSummarize({ type, data });

    res.status(200).json({
      success: true,
      data: {
        summary: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Summarize Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};

/**
 * @desc    AI Dashboard Insights
 * @route   GET /api/ai/dashboard-insights
 * @access  Private
 */
export const dashboardInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const [
      totalCustomers,
      activeCustomers,
      totalDeals,
      wonDeals,
      lostDeals,
      pendingTasks,
      overdueTasks,
    ] = await Promise.all([
      prisma.customer.count({ where: { ownerId: userId } }),
      prisma.customer.count({ where: { ownerId: userId, status: 'ACTIVE' } }),
      prisma.deal.count({ where: { ownerId: userId } }),
      prisma.deal.count({ where: { ownerId: userId, stage: 'CLOSED_WON' } }),
      prisma.deal.count({ where: { ownerId: userId, stage: 'CLOSED_LOST' } }),
      prisma.task.count({ where: { assignedToId: userId, status: 'PENDING' } }),
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const dealValues = await prisma.deal.aggregate({
      where: { ownerId: userId },
      _sum: { value: true },
    });

    const wonValues = await prisma.deal.aggregate({
      where: { ownerId: userId, stage: 'CLOSED_WON' },
      _sum: { value: true },
    });

    const result = await aiDashboardInsights({
      totalCustomers,
      activeCustomers,
      totalDeals,
      wonDeals,
      lostDeals,
      totalDealValue: dealValues._sum.value || 0,
      wonValue: wonValues._sum.value || 0,
      pendingTasks,
      overdueTasks,
    });

    res.status(200).json({
      success: true,
      data: {
        insights: result.content,
        model: result.model,
      },
    });
  } catch (error: any) {
    console.error('AI Dashboard Insights Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI service error',
    });
  }
};
