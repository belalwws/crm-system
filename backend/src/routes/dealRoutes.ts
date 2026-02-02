import express from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealStats,
} from '../controllers/dealController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Deal Routes
 * All routes are protected (require authentication)
 */
router.use(protect);

router.get('/stats', getDealStats);
router.route('/').get(getDeals).post(createDeal);
router.route('/:id').get(getDeal).put(updateDeal).delete(deleteDeal);

export default router;
