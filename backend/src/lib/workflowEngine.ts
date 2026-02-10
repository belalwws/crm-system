import prisma from './prisma';
import { createAuditLog, createTimelineEvent } from './auditLog';
import logger from './logger';
import crypto from 'crypto';

/**
 * Workflow Engine
 * Evaluates workflow rules when entities change and executes actions
 */

// Whitelisted fields that workflow UPDATE_FIELD can modify
const ALLOWED_DEAL_FIELDS = ['stage', 'probability', 'value', 'notesText', 'lostReason'];
const ALLOWED_CUSTOMER_FIELDS = ['status', 'industry', 'notesText'];

interface TriggerContext {
  userId: string;
  entityType: string;
  entityId: string;
  trigger: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
}

/**
 * Evaluate and execute matching workflow rules
 */
export async function evaluateWorkflows(ctx: TriggerContext): Promise<void> {
  try {
    // Find all active rules for this trigger
    const rules = await prisma.workflowRule.findMany({
      where: {
        ownerId: ctx.userId,
        trigger: ctx.trigger as any,
        isActive: true,
      },
    });

    for (const rule of rules) {
      try {
        const conditions = rule.conditions as any;
        const matched = evaluateConditions(conditions, ctx.newData || {}, ctx.oldData);

        if (matched) {
          await executeActions(rule, ctx);

          // Update execution count
          await prisma.workflowRule.update({
            where: { id: rule.id },
            data: {
              executionCount: { increment: 1 },
              lastTriggeredAt: new Date(),
            },
          });

          // Log successful execution
          await prisma.workflowLog.create({
            data: {
              ruleId: rule.id,
              entityType: ctx.entityType,
              entityId: ctx.entityId,
              status: 'SUCCESS',
              details: { trigger: ctx.trigger, conditions: conditions },
            },
          });
        }
      } catch (error: any) {
        // Log failed execution
        await prisma.workflowLog.create({
          data: {
            ruleId: rule.id,
            entityType: ctx.entityType,
            entityId: ctx.entityId,
            status: 'FAILED',
            details: { error: error.message },
          },
        });
      }
    }
  } catch (error) {
    logger.error('Workflow evaluation error:', error);
  }
}

/**
 * Evaluate conditions against entity data
 */
function evaluateConditions(
  conditions: any,
  newData: Record<string, any>,
  oldData?: Record<string, any>
): boolean {
  if (!conditions) return true;

  // Support array of conditions (AND logic)
  const conditionList = Array.isArray(conditions) ? conditions : [conditions];

  return conditionList.every((cond: any) => {
    const { field, operator, value } = cond;
    const entityValue = newData[field];
    const oldValue = oldData?.[field];

    switch (operator) {
      case 'equals':
        return entityValue === value;
      case 'not_equals':
        return entityValue !== value;
      case 'contains':
        return String(entityValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(entityValue) > Number(value);
      case 'less_than':
        return Number(entityValue) < Number(value);
      case 'changed_to':
        return entityValue === value && oldValue !== value;
      case 'changed_from':
        return oldValue === value && entityValue !== value;
      case 'is_empty':
        return !entityValue || entityValue === '';
      case 'is_not_empty':
        return !!entityValue && entityValue !== '';
      default:
        return false;
    }
  });
}

/**
 * Execute workflow actions
 */
async function executeActions(rule: any, ctx: TriggerContext): Promise<void> {
  const actions = rule.actions as any[];
  if (!Array.isArray(actions)) return;

  for (const action of actions) {
    switch (action.type) {
      case 'CREATE_TASK':
        await prisma.task.create({
          data: {
            title: action.params.title || `Auto-task from workflow: ${rule.name}`,
            description: action.params.description || `Created by workflow rule: ${rule.name}`,
            type: action.params.taskType || 'FOLLOW_UP',
            priority: action.params.priority || 'MEDIUM',
            status: 'PENDING',
            assignedToId: action.params.assignToId || ctx.userId,
            createdById: ctx.userId,
            customerId: ctx.entityType === 'Customer' ? ctx.entityId : undefined,
            dealId: ctx.entityType === 'Deal' ? ctx.entityId : undefined,
            dueDate: action.params.dueDays
              ? new Date(Date.now() + action.params.dueDays * 86400000)
              : undefined,
          },
        });
        break;

      case 'SEND_NOTIFICATION':
        await prisma.notification.create({
          data: {
            userId: action.params.notifyUserId || ctx.userId,
            type: 'WORKFLOW_TRIGGERED',
            title: action.params.title || `Workflow: ${rule.name}`,
            message: action.params.message || `Workflow "${rule.name}" was triggered`,
            link: action.params.link,
          },
        });
        break;

      case 'UPDATE_FIELD':
        // Validate field is whitelisted to prevent injection
        if (ctx.entityType === 'Deal') {
          if (!ALLOWED_DEAL_FIELDS.includes(action.params.field)) {
            logger.warn(`Workflow tried to update disallowed deal field: ${action.params.field}`);
            break;
          }
          await prisma.deal.update({
            where: { id: ctx.entityId },
            data: { [action.params.field]: action.params.value },
          });
        } else if (ctx.entityType === 'Customer') {
          if (!ALLOWED_CUSTOMER_FIELDS.includes(action.params.field)) {
            logger.warn(`Workflow tried to update disallowed customer field: ${action.params.field}`);
            break;
          }
          await prisma.customer.update({
            where: { id: ctx.entityId },
            data: { [action.params.field]: action.params.value },
          });
        }
        break;

      case 'MOVE_STAGE':
        if (ctx.entityType === 'Deal') {
          await prisma.deal.update({
            where: { id: ctx.entityId },
            data: { stage: action.params.stage },
          });
          await createTimelineEvent({
            ownerId: ctx.userId,
            type: 'STAGE_CHANGED',
            title: `Stage changed to ${action.params.stage} (auto)`,
            description: `Workflow "${rule.name}" moved deal stage`,
            dealId: ctx.entityId,
          });
        }
        break;

      case 'ADD_TAG':
        if (ctx.entityType === 'Customer') {
          const customer = await prisma.customer.findUnique({ where: { id: ctx.entityId } });
          if (customer) {
            const tags = [...new Set([...customer.tags, action.params.tag])];
            await prisma.customer.update({
              where: { id: ctx.entityId },
              data: { tags },
            });
          }
        }
        break;

      case 'ASSIGN_TO':
        if (ctx.entityType === 'Deal') {
          await prisma.deal.update({
            where: { id: ctx.entityId },
            data: { ownerId: action.params.assignToId },
          });
        }
        break;

      default:
        logger.warn(`Unknown workflow action type: ${action.type}`);
    }
  }
}

/**
 * Fire webhooks for a given event
 */
export async function fireWebhooks(
  userId: string,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        ownerId: userId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            ...(webhook.secret && {
              'X-Webhook-Signature': createHmacSignature(
                JSON.stringify(payload),
                webhook.secret
              ),
            }),
          },
          body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            payload,
            statusCode: response.status,
            success: response.ok,
            response: await response.text().catch(() => ''),
          },
        });

        // Update webhook
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            failCount: response.ok ? 0 : { increment: 1 },
          },
        });

        // Disable webhook after 10 consecutive failures
        if (!response.ok) {
          const updated = await prisma.webhook.findUnique({ where: { id: webhook.id } });
          if (updated && updated.failCount >= 10) {
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: { isActive: false },
            });
          }
        }
      } catch (error: any) {
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            payload,
            success: false,
            response: error.message,
          },
        });
      }
    }
  } catch (error) {
    logger.error('Webhook fire error:', error);
  }
}

/**
 * Create HMAC signature for webhook payloads
 */
function createHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
