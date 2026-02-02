import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Customer Routes
 * All routes are protected (require authentication)
 */
router.use(protect);

router.route('/').get(getCustomers).post(createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
