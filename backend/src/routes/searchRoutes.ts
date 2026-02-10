import express from 'express';
import {
  globalSearch,
  getSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
} from '../controllers/searchController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSavedViewSchema, updateSavedViewSchema } from '../lib/validators';

const router = express.Router();
router.use(protect);

router.get('/', globalSearch);
router.route('/saved-views').get(getSavedViews).post(validate(createSavedViewSchema), createSavedView);
router.route('/saved-views/:id').put(validate(updateSavedViewSchema), updateSavedView).delete(deleteSavedView);

export default router;
