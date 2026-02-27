import express from 'express';
import { getAuditLogs, getEntityAuditTrail } from '../controllers/auditLogController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', getAuditLogs);
router.get('/:entityType/:entityId', getEntityAuditTrail);

export default router;
