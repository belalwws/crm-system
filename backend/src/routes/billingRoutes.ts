import express from 'express';
import { protect } from '../middleware/auth';
import {
  getSubscription,
  getPlans,
  createCheckout,
  createPortal,
  handleWebhook,
  getInvoices,
} from '../controllers/billingController';

const router = express.Router();

// Stripe webhook (needs raw body - must be before json parser)
// Note: This route is mounted separately in server.ts with raw body
router.post('/webhook', handleWebhook);

// Public
router.get('/plans', getPlans);

// Authenticated
router.get('/subscription', protect, getSubscription);
router.post('/checkout', protect, createCheckout);
router.post('/portal', protect, createPortal);
router.get('/invoices', protect, getInvoices);

export default router;
