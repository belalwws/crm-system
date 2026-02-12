import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';
import Stripe from 'stripe';

// Initialize Stripe (lazy - only if STRIPE_SECRET_KEY is set)
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
  }
  return stripe;
}

// Plan definitions with limits
export const PLAN_LIMITS = {
  FREE: {
    name: 'Free',
    price: 0,
    customers: 50,
    deals: 20,
    users: 1,
    storageMB: 100,
    aiRequests: 10,
    features: ['basic_crm', 'email_templates'],
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    customers: 500,
    deals: 200,
    users: 5,
    storageMB: 1024,
    aiRequests: 100,
    features: ['basic_crm', 'email_templates', 'documents', 'reports', 'workflows'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 79,
    customers: 5000,
    deals: 2000,
    users: 25,
    storageMB: 10240,
    aiRequests: 500,
    features: ['basic_crm', 'email_templates', 'documents', 'reports', 'workflows', 'ai_insights', 'custom_fields', 'webhooks', 'api_access'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    customers: -1, // unlimited
    deals: -1,
    users: -1,
    storageMB: -1,
    aiRequests: -1,
    features: ['basic_crm', 'email_templates', 'documents', 'reports', 'workflows', 'ai_insights', 'custom_fields', 'webhooks', 'api_access', 'white_label', 'priority_support', 'sla'],
  },
} as const;

/**
 * @desc    Get current user's subscription
 * @route   GET /api/billing/subscription
 * @access  Authenticated
 */
export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (!subscription) {
      // Create default FREE subscription with 14-day trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      subscription = await prisma.subscription.create({
        data: {
          userId: req.user!.id,
          plan: 'FREE',
          status: 'TRIALING',
          trialStart: new Date(),
          trialEnd,
        },
      });
    }

    const plan = subscription.plan as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];

    res.json({
      success: true,
      data: {
        ...subscription,
        limits,
        usage: {
          customers: { used: subscription.customersUsed, limit: limits.customers },
          deals: { used: subscription.dealsUsed, limit: limits.deals },
          users: { used: subscription.usersUsed, limit: limits.users },
          storage: { used: subscription.storageUsedMB, limit: limits.storageMB },
          aiRequests: { used: subscription.aiRequestsUsed, limit: limits.aiRequests },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

/**
 * @desc    Get available plans
 * @route   GET /api/billing/plans
 * @access  Public
 */
export const getPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  const plans = Object.entries(PLAN_LIMITS).map(([key, plan]) => ({
    id: key,
    ...plan,
    priceMonthly: plan.price,
    priceYearly: Math.round(plan.price * 10), // 2 months free on yearly
  }));

  res.json({ success: true, data: plans });
};

/**
 * @desc    Create Stripe Checkout session
 * @route   POST /api/billing/checkout
 * @access  Authenticated
 */
export const createCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const s = getStripe();
    const { priceId, plan, interval = 'month' } = req.body;

    if (!plan || !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan)) {
      res.status(400).json({ success: false, message: 'Invalid plan selected' });
      return;
    }

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { email: true, name: true },
      });

      const customer = await s.customers.create({
        email: user!.email,
        name: user!.name,
        metadata: { userId: req.user!.id },
      });

      customerId = customer.id;

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: req.user!.id,
            plan: 'FREE',
            status: 'TRIALING',
            stripeCustomerId: customerId,
            trialStart: new Date(),
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Use provided priceId or lookup from env
    const resolvedPriceId = priceId || process.env[`STRIPE_PRICE_${plan}_${interval.toUpperCase()}`];

    if (!resolvedPriceId) {
      res.status(400).json({ success: false, message: 'Price configuration not found. Contact support.' });
      return;
    }

    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?canceled=true`,
      metadata: { userId: req.user!.id, plan },
      subscription_data: {
        metadata: { userId: req.user!.id, plan },
      },
    });

    res.json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (error) {
    logger.error('Error creating checkout:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};

/**
 * @desc    Create Stripe Customer Portal session
 * @route   POST /api/billing/portal
 * @access  Authenticated
 */
export const createPortal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const s = getStripe();
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (!subscription?.stripeCustomerId) {
      res.status(400).json({ success: false, message: 'No billing account found' });
      return;
    }

    const session = await s.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    logger.error('Error creating portal:', error);
    res.status(500).json({ success: false, message: 'Failed to create billing portal' });
  }
};

/**
 * @desc    Handle Stripe Webhook events
 * @route   POST /api/billing/webhook
 * @access  Stripe (no auth)
 */
export const handleWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const s = getStripe();
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      res.status(500).json({ success: false, message: 'Webhook not configured' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = s.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      res.status(400).json({ success: false, message: 'Invalid signature' });
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
            },
            create: {
              userId,
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
            },
          });
          logger.info(`User ${userId} subscribed to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              status: sub.status === 'active' ? 'ACTIVE' :
                sub.status === 'trialing' ? 'TRIALING' :
                sub.status === 'past_due' ? 'PAST_DUE' :
                sub.status === 'canceled' ? 'CANCELED' :
                sub.status === 'unpaid' ? 'UNPAID' : 'PAUSED',
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'CANCELED',
              canceledAt: new Date(),
              plan: 'FREE',
            },
          });
          logger.info(`User ${userId} subscription canceled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const sub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
          // Create notification for user
          await prisma.notification.create({
            data: {
              userId: sub.userId,
              type: 'SYSTEM',
              title: 'Payment Failed',
              message: 'Your latest payment has failed. Please update your payment method to avoid service interruption.',
              link: '/dashboard/billing',
            },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

/**
 * @desc    Get billing history/invoices
 * @route   GET /api/billing/invoices
 * @access  Authenticated
 */
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (!subscription?.stripeCustomerId) {
      res.json({ success: true, data: [] });
      return;
    }

    try {
      const s = getStripe();
      const invoices = await s.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 20,
      });

      const formatted = invoices.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: (inv.amount_paid || 0) / 100,
        currency: inv.currency,
        status: inv.status,
        date: inv.created ? new Date(inv.created * 1000) : null,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      }));

      res.json({ success: true, data: formatted });
    } catch {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};
