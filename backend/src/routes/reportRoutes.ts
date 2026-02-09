import express from 'express';
import {
  getConversionFunnel,
  getDealAging,
  getRevenueForecast,
  getPerformanceMetrics,
  getActivityHeatmap,
} from '../controllers/reportController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/funnel', getConversionFunnel);
router.get('/aging', getDealAging);
router.get('/forecast', getRevenueForecast);
router.get('/performance', getPerformanceMetrics);
router.get('/activity-heatmap', getActivityHeatmap);

export default router;
