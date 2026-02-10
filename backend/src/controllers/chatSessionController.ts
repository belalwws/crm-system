import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';
import {
  aiChat,
  ChatMessage as AIChatMessage,
} from '../lib/ai';
import {
  parseActions,
  executeAction,
  ActionResult,
} from '../lib/ai-actions';

// =============================================
// Chat Sessions CRUD
// =============================================

/**
 * @desc    List all chat sessions for the current user
 * @route   GET /api/ai/sessions
 * @access  Private
 */
export const listSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: sessions.map(s => ({
        ...s,
        messageCount: s._count.messages,
        lastMessage: s.messages[0] || null,
        _count: undefined,
        messages: undefined,
      })),
    });
  } catch (error: any) {
    logger.error('List sessions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new chat session
 * @route   POST /api/ai/sessions
 * @access  Private
 */
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    const session = await prisma.chatSession.create({
      data: {
        title: title || 'New Chat',
        userId: req.user!.id,
      },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error: any) {
    logger.error('Create session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a session with all its messages
 * @route   GET /api/ai/sessions/:sessionId
 * @access  Private
 */
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sessionId, userId: req.user!.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    logger.error('Get session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update session (rename, pin)
 * @route   PUT /api/ai/sessions/:sessionId
 * @access  Private
 */
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, pinned } = req.body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (pinned !== undefined) updateData.pinned = pinned;

    const session = await prisma.chatSession.update({
      where: { id: req.params.sessionId, userId: req.user!.id },
      data: updateData,
    });

    res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    logger.error('Update session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a session and all its messages
 * @route   DELETE /api/ai/sessions/:sessionId
 * @access  Private
 */
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.chatSession.delete({
      where: { id: req.params.sessionId, userId: req.user!.id },
    });

    res.status(200).json({ success: true, message: 'Session deleted' });
  } catch (error: any) {
    logger.error('Delete session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================
// Enhanced Chat with Actions & Persistence
// =============================================

/**
 * @desc    Send a message in a session — AI processes, executes actions, returns response
 * @route   POST /api/ai/sessions/:sessionId/messages
 * @access  Private
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const { sessionId } = req.params;
    const userId = req.user!.id;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    // Verify session ownership
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Save user message
    const userMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Build conversation history from DB
    const dbMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Keep last 50 messages for context
    });

    const conversationHistory: AIChatMessage[] = dbMessages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Build CRM context
    const [customerCount, dealCount, taskCount] = await Promise.all([
      prisma.customer.count({ where: { ownerId: userId, deletedAt: null } }),
      prisma.deal.count({ where: { ownerId: userId, deletedAt: null } }),
      prisma.task.count({ where: { assignedToId: userId, status: { not: 'COMPLETED' }, deletedAt: null } }),
    ]);
    const crmContext = `User has ${customerCount} customers, ${dealCount} deals, and ${taskCount} active tasks.`;

    // Call AI
    const aiResponse = await aiChat(message, crmContext, conversationHistory);

    // Parse actions from AI response
    const { text, actions } = parseActions(aiResponse.content);

    // Execute actions
    let actionResults: ActionResult[] = [];
    if (actions.length > 0) {
      actionResults = await Promise.all(
        actions.map(action => executeAction(action, userId))
      );
    }

    // If there are action results, send them back to AI for a natural response
    let finalContent = aiResponse.content;
    if (actionResults.length > 0) {
      const resultSummary = actionResults.map(r =>
        `Action: ${r.action} — ${r.success ? '✅ Success' : '❌ Failed'}: ${r.message}${r.data ? '\nData: ' + JSON.stringify(r.data, null, 2) : ''}`
      ).join('\n\n');

      // Second AI call for natural interpretation of results
      const followUp = await aiChat(
        `The following CRM actions were executed based on your instructions. Summarize the results naturally for the user:\n\n${resultSummary}`,
        crmContext,
        conversationHistory
      );
      finalContent = followUp.content;
    }

    // Save assistant message
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: finalContent,
        actionType: actions.length > 0 ? actions.map(a => a.action).join(',') : null,
        actionData: actions.length > 0 ? JSON.parse(JSON.stringify(actions)) : undefined,
        actionResult: actionResults.length > 0 ? JSON.parse(JSON.stringify(actionResults)) : undefined,
      },
    });

    // Auto-title the session if it's the first exchange
    if (session.title === 'New Chat' && dbMessages.length <= 1) {
      const titleContent = message.substring(0, 60);
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: titleContent },
      });
    } else {
      // Touch updatedAt
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        actions: actionResults.length > 0 ? actionResults : undefined,
      },
    });
  } catch (error: any) {
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message || 'AI service error' });
  }
};
