import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
} from '../controllers/dashboardController';
import { protect } from '../middleware/auth';
import { cacheMiddleware } from '../lib/redis';

const router = express.Router();

/**
 * Dashboard Routes
 * All routes are protected (require authentication)
 */
router.use(protect);

router.get('/stats', cacheMiddleware('dashboard-stats', 120), getDashboardStats);
router.get('/activities', cacheMiddleware('dashboard-activities', 60), getRecentActivities);

export default router;
