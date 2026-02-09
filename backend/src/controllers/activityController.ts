import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { ActivityType } from '@prisma/client';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

// Get all activities for the current user
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { entityType, entityId, limit = '50' } = req.query;

    const where: any = { ownerId: userId };
    
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

// Get activities for a specific entity
export const getEntityActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { entityType, entityId } = req.params;

    const activities = await prisma.activity.findMany({
      where: {
        ownerId: userId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error fetching entity activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

// Helper function to log an activity
export const logActivity = async (
  ownerId: string,
  type: ActivityType,
  entityType: 'customer' | 'deal' | 'task',
  entityId: string,
  title: string,
  details?: Record<string, any>
) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        ownerId,
        type,
        entityType,
        entityId,
        title,
        details: details || undefined,
      },
    });
    return activity;
  } catch (error) {
    logger.error('Error logging activity:', error);
    return null;
  }
};

// Convenience helpers for common activities
export const logCustomerCreated = (ownerId: string, customerId: string, customerName: string) => {
  return logActivity(ownerId, 'CREATED', 'customer', customerId, `Created customer "${customerName}"`);
};

export const logCustomerUpdated = (ownerId: string, customerId: string, customerName: string, changes?: Record<string, any>) => {
  return logActivity(ownerId, 'UPDATED', 'customer', customerId, `Updated customer "${customerName}"`, changes);
};

export const logCustomerDeleted = (ownerId: string, customerId: string, customerName: string) => {
  return logActivity(ownerId, 'DELETED', 'customer', customerId, `Deleted customer "${customerName}"`);
};

export const logCustomerStatusChanged = (ownerId: string, customerId: string, customerName: string, oldStatus: string, newStatus: string) => {
  return logActivity(ownerId, 'STATUS_CHANGED', 'customer', customerId, `Changed "${customerName}" status from ${oldStatus} to ${newStatus}`, { oldStatus, newStatus });
};

export const logDealCreated = (ownerId: string, dealId: string, dealTitle: string, value: number) => {
  return logActivity(ownerId, 'CREATED', 'deal', dealId, `Created deal "${dealTitle}" worth $${value.toLocaleString()}`);
};

export const logDealUpdated = (ownerId: string, dealId: string, dealTitle: string, changes?: Record<string, any>) => {
  return logActivity(ownerId, 'UPDATED', 'deal', dealId, `Updated deal "${dealTitle}"`, changes);
};

export const logDealDeleted = (ownerId: string, dealId: string, dealTitle: string) => {
  return logActivity(ownerId, 'DELETED', 'deal', dealId, `Deleted deal "${dealTitle}"`);
};

export const logDealStageChanged = (ownerId: string, dealId: string, dealTitle: string, oldStage: string, newStage: string) => {
  return logActivity(ownerId, 'STAGE_CHANGED', 'deal', dealId, `Moved "${dealTitle}" from ${oldStage.replace('_', ' ')} to ${newStage.replace('_', ' ')}`, { oldStage, newStage });
};

export const logTaskCreated = (ownerId: string, taskId: string, taskTitle: string) => {
  return logActivity(ownerId, 'CREATED', 'task', taskId, `Created task "${taskTitle}"`);
};

export const logTaskUpdated = (ownerId: string, taskId: string, taskTitle: string, changes?: Record<string, any>) => {
  return logActivity(ownerId, 'UPDATED', 'task', taskId, `Updated task "${taskTitle}"`, changes);
};

export const logTaskCompleted = (ownerId: string, taskId: string, taskTitle: string) => {
  return logActivity(ownerId, 'TASK_COMPLETED', 'task', taskId, `Completed task "${taskTitle}"`);
};

export const logTaskDeleted = (ownerId: string, taskId: string, taskTitle: string) => {
  return logActivity(ownerId, 'DELETED', 'task', taskId, `Deleted task "${taskTitle}"`);
};

export const logEmailSent = (ownerId: string, entityType: 'customer' | 'deal', entityId: string, recipientEmail: string, subject: string) => {
  return logActivity(ownerId, 'EMAIL_SENT', entityType, entityId, `Sent email to ${recipientEmail}: "${subject}"`);
};

export const logNoteAdded = (ownerId: string, entityType: 'customer' | 'deal' | 'task', entityId: string, notePreview: string) => {
  return logActivity(ownerId, 'NOTE_ADDED', entityType, entityId, `Added note: "${notePreview.substring(0, 50)}..."`);
};

export const logFileUploaded = (ownerId: string, entityType: 'customer' | 'deal', entityId: string, fileName: string) => {
  return logActivity(ownerId, 'FILE_UPLOADED', entityType, entityId, `Uploaded file "${fileName}"`);
};
