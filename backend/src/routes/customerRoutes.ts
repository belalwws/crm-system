import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  checkDuplicates,
  mergeCustomers,
} from '../controllers/customerController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from '../lib/validators';

const router = express.Router();

router.use(protect);

router.route('/').get(getCustomers).post(validate(createCustomerSchema), createCustomer);
router.post('/check-duplicates', checkDuplicates);
router.post('/merge', mergeCustomers);

router.route('/:id').get(getCustomer).put(validate(updateCustomerSchema), updateCustomer).delete(deleteCustomer);
router.post('/:id/restore', restoreCustomer);

export default router;
