import express from 'express';
import {
  getWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  getWorkflowLogs,
  toggleWorkflowRule,
} from '../controllers/workflowController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.route('/').get(getWorkflowRules).post(createWorkflowRule);
router.route('/:id').put(updateWorkflowRule).delete(deleteWorkflowRule);
router.get('/:id/logs', getWorkflowLogs);
router.patch('/:id/toggle', toggleWorkflowRule);

export default router;
