import express from 'express';
import {
  getCustomerTimeline,
  getDealTimeline,
  createTimelineEntry,
} from '../controllers/timelineController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.post('/', createTimelineEntry);
router.get('/customer/:customerId', getCustomerTimeline);
router.get('/deal/:dealId', getDealTimeline);

export default router;
