import express from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  restoreDeal,
  getDealStats,
} from '../controllers/dealController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkLimit } from '../middleware/subscription';
import { createDealSchema, updateDealSchema } from '../lib/validators';

const router = express.Router();

router.use(protect);

router.get('/stats', getDealStats);
router.route('/').get(getDeals).post(validate(createDealSchema), checkLimit('deals'), createDeal);
router.route('/:id').get(getDeal).put(validate(updateDealSchema), updateDeal).delete(deleteDeal);
router.post('/:id/restore', restoreDeal);

export default router;
