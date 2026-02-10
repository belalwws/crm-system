import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

// Get all notifications for the current user
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark a notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.deleteMany({
      where: { id, userId },
    });

    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to delete all notifications' });
  }
};

import { emitToUser } from '../lib/socket';

// Helper function to create a notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });

    // Real-time push via WebSocket
    emitToUser(userId, 'notification:new', notification);

    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    return null;
  }
};

// Helper to create task due notification
export const notifyTaskDue = async (userId: string, taskTitle: string, taskId: string) => {
  return createNotification(
    userId,
    'TASK_DUE',
    'Task Due Soon',
    `Task "${taskTitle}" is due soon`,
    `/dashboard/tasks?id=${taskId}`
  );
};

// Helper to create deal won notification
export const notifyDealWon = async (userId: string, dealTitle: string, dealId: string, value: number) => {
  return createNotification(
    userId,
    'DEAL_WON',
    'Deal Won! 🎉',
    `Congratulations! Deal "${dealTitle}" worth $${value.toLocaleString()} has been won`,
    `/dashboard/deals?id=${dealId}`
  );
};

// Helper to create deal lost notification
export const notifyDealLost = async (userId: string, dealTitle: string, dealId: string) => {
  return createNotification(
    userId,
    'DEAL_LOST',
    'Deal Lost',
    `Deal "${dealTitle}" has been marked as lost`,
    `/dashboard/deals?id=${dealId}`
  );
};

// Helper to create new customer notification
export const notifyNewCustomer = async (userId: string, customerName: string, customerId: string) => {
  return createNotification(
    userId,
    'NEW_CUSTOMER',
    'New Customer Added',
    `New customer "${customerName}" has been added`,
    `/dashboard/customers?id=${customerId}`
  );
};

// Helper to create task assigned notification
export const notifyTaskAssigned = async (userId: string, taskTitle: string, taskId: string, assignerName: string) => {
  return createNotification(
    userId,
    'TASK_ASSIGNED',
    'New Task Assigned',
    `${assignerName} assigned you a new task: "${taskTitle}"`,
    `/dashboard/tasks?id=${taskId}`
  );
};

// Helper to create deal stage changed notification
export const notifyDealStageChanged = async (userId: string, dealTitle: string, dealId: string, newStage: string) => {
  return createNotification(
    userId,
    'DEAL_STAGE_CHANGED',
    'Deal Stage Updated',
    `Deal "${dealTitle}" moved to ${newStage.replace('_', ' ')}`,
    `/dashboard/deals?id=${dealId}`
  );
};
