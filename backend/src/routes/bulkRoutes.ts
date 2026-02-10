import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  bulkDeleteCustomers,
  bulkDeleteDeals,
  bulkDeleteTasks,
  bulkUpdateDealStage,
  bulkUpdateTaskStatus,
  bulkAssignTasks,
} from '../controllers/bulkController';

const router = Router();
router.use(protect);

// Bulk delete
router.post('/customers/delete', bulkDeleteCustomers);
router.post('/deals/delete', bulkDeleteDeals);
router.post('/tasks/delete', bulkDeleteTasks);

// Bulk update
router.post('/deals/stage', bulkUpdateDealStage);
router.post('/tasks/status', bulkUpdateTaskStatus);
router.post('/tasks/assign', bulkAssignTasks);

export default router;
