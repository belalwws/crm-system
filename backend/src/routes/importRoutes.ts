import { Router } from 'express';
import { protect } from '../middleware/auth';
import { importCustomers } from '../controllers/exportController';

const router = Router();
router.use(protect);

// Import endpoints
router.post('/customers', importCustomers);

export default router;
