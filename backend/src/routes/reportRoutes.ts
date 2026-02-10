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

const router = express.Router();
router.use(protect);
router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/funnel', getConversionFunnel);
router.get('/aging', getDealAging);
router.get('/forecast', getRevenueForecast);
router.get('/performance', getPerformanceMetrics);
router.get('/activity-heatmap', getActivityHeatmap);

export default router;
