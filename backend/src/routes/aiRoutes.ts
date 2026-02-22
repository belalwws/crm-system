import { Router } from 'express';
import { protect } from '../middleware/auth';
import { checkLimit } from '../middleware/subscription';
import {
  chat,
  composeEmail,
  customerInsights,
  dealAnalysis,
  prioritizeTasks,
  summarize,
  dashboardInsights,
} from '../controllers/aiController';
import {
  listSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  sendMessage,
} from '../controllers/chatSessionController';

const router = Router();

// All AI routes require authentication
router.use(protect);

// ---- Chat Sessions ----
router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.put('/sessions/:sessionId', updateSession);
router.delete('/sessions/:sessionId', deleteSession);
router.post('/sessions/:sessionId/messages', checkLimit('aiRequests'), sendMessage);

// ---- Legacy AI Endpoints (still used by insight components) ----
// General AI Chat
router.post('/chat', checkLimit('aiRequests'), chat);

// Email Composition
router.post('/compose-email', checkLimit('aiRequests'), composeEmail);

// Customer Insights
router.get('/customer-insights/:customerId', checkLimit('aiRequests'), customerInsights);

// Deal Analysis
router.get('/deal-analysis/:dealId', checkLimit('aiRequests'), dealAnalysis);

// Task Prioritization
router.get('/prioritize-tasks', checkLimit('aiRequests'), prioritizeTasks);

// Summarize
router.post('/summarize', checkLimit('aiRequests'), summarize);

// Dashboard Insights
router.get('/dashboard-insights', checkLimit('aiRequests'), dashboardInsights);

export default router;
