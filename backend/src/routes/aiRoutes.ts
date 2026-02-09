import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  chat,
  composeEmail,
  customerInsights,
  dealAnalysis,
  prioritizeTasks,
  summarize,
  dashboardInsights,
} from '../controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(protect);

// General AI Chat
router.post('/chat', chat);

// Email Composition
router.post('/compose-email', composeEmail);

// Customer Insights
router.get('/customer-insights/:customerId', customerInsights);

// Deal Analysis
router.get('/deal-analysis/:dealId', dealAnalysis);

// Task Prioritization
router.get('/prioritize-tasks', prioritizeTasks);

// Summarize
router.post('/summarize', summarize);

// Dashboard Insights
router.get('/dashboard-insights', dashboardInsights);

export default router;
