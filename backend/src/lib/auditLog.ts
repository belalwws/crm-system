import prisma from './prisma';

/**
 * Audit Log Service
 * Records all data changes for compliance and traceability
 */

interface AuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        oldValues: params.oldValues || undefined,
        newValues: params.newValues || undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should never break the main operation
  }
}

/**
 * Creates a timeline event for customers/deals
 */
export async function createTimelineEvent(params: {
  ownerId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  dealId?: string;
}): Promise<void> {
  try {
    await prisma.timelineEvent.create({
      data: {
        ownerId: params.ownerId,
        type: params.type as any,
        title: params.title,
        description: params.description,
        metadata: params.metadata || undefined,
        customerId: params.customerId,
        dealId: params.dealId,
      },
    });
  } catch (error) {
    console.error('Failed to create timeline event:', error);
  }
}

/**
 * Compute diff between old and new values for audit trail
 */
export function computeDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fields: string[]
): { oldValues: Record<string, any>; newValues: Record<string, any> } | null {
  const oldValues: Record<string, any> = {};
  const newValues: Record<string, any> = {};
  let hasChanges = false;

  for (const field of fields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      oldValues[field] = oldVal;
      newValues[field] = newVal;
      hasChanges = true;
    }
  }

  return hasChanges ? { oldValues, newValues } : null;
}
