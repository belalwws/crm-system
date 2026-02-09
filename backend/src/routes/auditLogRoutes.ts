import express from 'express';
import { getAuditLogs, getEntityAuditTrail } from '../controllers/auditLogController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();
router.use(protect);
router.use(requireRole('ADMIN', 'MANAGER'));

router.get('/', getAuditLogs);
router.get('/:entityType/:entityId', getEntityAuditTrail);

export default router;
