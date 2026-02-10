import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  exportCustomers,
  exportDeals,
  exportTasks,
  importCustomers,
} from '../controllers/exportController';

const router = Router();
router.use(protect);

// Export endpoints
router.get('/customers', exportCustomers);
router.get('/deals', exportDeals);
router.get('/tasks', exportTasks);

// Import endpoint  
router.post('/customers', importCustomers);

export default router;
