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
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createWorkflowSchema, updateWorkflowSchema } from '../lib/validators';

const router = express.Router();
router.use(protect);
router.use(requireRole('ADMIN', 'MANAGER'));

router.route('/').get(getWorkflowRules).post(validate(createWorkflowSchema), createWorkflowRule);
router.route('/:id').put(validate(updateWorkflowSchema), updateWorkflowRule).delete(deleteWorkflowRule);
router.get('/:id/logs', getWorkflowLogs);
router.patch('/:id/toggle', toggleWorkflowRule);

export default router;
