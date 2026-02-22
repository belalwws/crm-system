import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import crypto from 'crypto';
import { URL } from 'url';

/**
 * SSRF Protection: validate webhook URLs to prevent internal network access
 */
function isUrlSafe(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block localhost, loopback, internal IPs
    const blockedPatterns = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]',
      '169.254.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
      '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
      '192.168.', 'metadata.google.internal', '100.100.100.200',
    ];
    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.startsWith(pattern)) return false;
    }
    // Block .local, .internal domains
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * @desc    Get all webhooks
 * @route   GET /api/webhooks
 * @access  Private
 */
export const getWebhooks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { ownerId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { logs: true } } },
    });
    res.status(200).json({ success: true, data: webhooks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching webhooks' });
  }
};

/**
 * @desc    Create webhook
 * @route   POST /api/webhooks
 * @access  Private
 */
export const createWebhook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, url, events, isActive } = req.body;
    if (!name || !url || !events || events.length === 0) {
      res.status(400).json({ success: false, message: 'name, url, and events are required' });
      return;
    }

    if (!isUrlSafe(url)) {
      res.status(400).json({ success: false, message: 'Invalid webhook URL. Internal/private network URLs are not allowed.' });
      return;
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        ownerId: req.user?.id as string,
        name,
        url,
        events,
        secret,
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, data: webhook });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating webhook' });
  }
};

/**
 * @desc    Update webhook
 * @route   PUT /api/webhooks/:id
 * @access  Private
 */
export const updateWebhook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.webhook.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }

    const { name, url, events, isActive } = req.body;

    if (url && !isUrlSafe(url)) {
      res.status(400).json({ success: false, message: 'Invalid webhook URL. Internal/private network URLs are not allowed.' });
      return;
    }

    const webhook = await prisma.webhook.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(events && { events }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({ success: true, data: webhook });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating webhook' });
  }
};

/**
 * @desc    Delete webhook
 * @route   DELETE /api/webhooks/:id
 * @access  Private
 */
export const deleteWebhook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.webhook.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }
    await prisma.webhook.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Webhook deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting webhook' });
  }
};

/**
 * @desc    Get webhook logs
 * @route   GET /api/webhooks/:id/logs
 * @access  Private
 */
export const getWebhookLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.webhook.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching webhook logs' });
  }
};

/**
 * @desc    Test webhook
 * @route   POST /api/webhooks/:id/test
 * @access  Private
 */
export const testWebhook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });
    if (!webhook) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }

    const testPayload = {
      event: 'webhook.test',
      data: { message: 'This is a test webhook delivery', timestamp: new Date().toISOString() },
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'webhook.test',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      });

      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: 'webhook.test',
          payload: testPayload,
          statusCode: response.status,
          success: response.ok,
          response: await response.text().catch(() => ''),
        },
      });

      res.status(200).json({
        success: true,
        data: { statusCode: response.status, ok: response.ok },
      });
    } catch (fetchError: any) {
      res.status(200).json({
        success: false,
        message: `Webhook delivery failed: ${fetchError.message}`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error testing webhook' });
  }
};
