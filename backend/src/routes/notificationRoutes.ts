import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get all notifications
router.get('/', getNotifications);

// POST /api/notifications/:id/read - Mark as read
router.post('/:id/read', markAsRead);

// POST /api/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

// DELETE /api/notifications - Delete all notifications
router.delete('/', deleteAllNotifications);

export default router;
