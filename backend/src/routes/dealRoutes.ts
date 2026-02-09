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

const router = express.Router();

router.use(protect);

router.get('/stats', getDealStats);
router.route('/').get(getDeals).post(createDeal);
router.route('/:id').get(getDeal).put(updateDeal).delete(deleteDeal);
router.post('/:id/restore', restoreDeal);

export default router;
