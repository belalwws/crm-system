import express from 'express';
import {
  globalSearch,
  getSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
} from '../controllers/searchController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', globalSearch);
router.route('/saved-views').get(getSavedViews).post(createSavedView);
router.route('/saved-views/:id').put(updateSavedView).delete(deleteSavedView);

export default router;
