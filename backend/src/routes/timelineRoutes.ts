import express from 'express';
import {
  getCustomerTimeline,
  getDealTimeline,
  createTimelineEntry,
} from '../controllers/timelineController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTimelineEntrySchema } from '../lib/validators';

const router = express.Router();
router.use(protect);

router.post('/', validate(createTimelineEntrySchema), createTimelineEntry);
router.get('/customer/:customerId', getCustomerTimeline);
router.get('/deal/:dealId', getDealTimeline);

export default router;
