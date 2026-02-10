import express from 'express';
import {
  getConversionFunnel,
  getDealAging,
  getRevenueForecast,
  getPerformanceMetrics,
  getActivityHeatmap,
} from '../controllers/reportController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { cacheMiddleware } from '../lib/redis';

const router = express.Router();
router.use(protect);
router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/funnel', cacheMiddleware('report-funnel', 300), getConversionFunnel);
router.get('/aging', cacheMiddleware('report-aging', 300), getDealAging);
router.get('/forecast', cacheMiddleware('report-forecast', 300), getRevenueForecast);
router.get('/performance', cacheMiddleware('report-performance', 180), getPerformanceMetrics);
router.get('/activity-heatmap', cacheMiddleware('report-heatmap', 300), getActivityHeatmap);

export default router;
