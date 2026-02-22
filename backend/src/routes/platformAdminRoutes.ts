import express from 'express';
import {
  platformAdminLogin,
  verifyPlatformAdmin,
  getPlatformOverview,
  getSystemHealth,
  getAllUsers,
  updateUserAsPlatformAdmin,
  deleteUserAsPlatformAdmin,
  getAuditLogs,
  getDatabaseStats,
  changePlatformAdminPassword,
  updateUserSubscription,
  updateUserProfile,
} from '../controllers/platformAdminController';

const router = express.Router();

// Public route - login
router.post('/login', platformAdminLogin);

// All routes below require platform admin authentication
router.use(verifyPlatformAdmin);

// Dashboard & Overview
router.get('/overview', getPlatformOverview);
router.get('/health', getSystemHealth);
router.get('/db-stats', getDatabaseStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserAsPlatformAdmin);
router.put('/users/:id/subscription', updateUserSubscription);
router.put('/users/:id/profile', updateUserProfile);
router.delete('/users/:id', deleteUserAsPlatformAdmin);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// Settings
router.post('/change-password', changePlatformAdminPassword);

export default router;
