import express from 'express';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { updateUserRoleSchema, updateUserSchema, toggleUserStatusSchema, inviteUserSchema, updateSystemSettingsSchema } from '../lib/validators';
import {
  getUsers,
  getUser,
  updateUserRole,
  toggleUserStatus,
  updateUser,
  deleteUser,
  getPlatformStats,
  inviteUser,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/adminController';
import {
  getAdminDashboard,
  getSubscriptions,
  updateSubscription,
  getSubscriptionStats,
  getPushTokens,
  sendPushNotification,
  getPushNotificationHistory,
} from '../controllers/adminExtendedController';

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(protect);
router.use(requireRole('ADMIN'));

// Enhanced dashboard
router.get('/dashboard', getAdminDashboard);

// Platform stats (legacy)
router.get('/stats', getPlatformStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', validate(updateUserSchema), updateUser);
router.patch('/users/:id/role', validate(updateUserRoleSchema), updateUserRole);
router.patch('/users/:id/status', validate(toggleUserStatusSchema), toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Invite user
router.post('/invite', validate(inviteUserSchema), inviteUser);

// Subscription management
router.get('/subscriptions/stats', getSubscriptionStats);
router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:userId', updateSubscription);

// Push notification management
router.get('/push-tokens', getPushTokens);
router.post('/notifications/push', sendPushNotification);
router.get('/notifications/push/history', getPushNotificationHistory);

// System settings
router.get('/settings', getSystemSettings);
router.put('/settings', validate(updateSystemSettingsSchema), updateSystemSettings);

export default router;
