import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
} from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Dashboard Routes
 * All routes are protected (require authentication)
 */
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);

export default router;
