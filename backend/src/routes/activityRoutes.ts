import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getActivities, getEntityActivities } from '../controllers/activityController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/activities - Get all activities
router.get('/', getActivities);

// GET /api/activities/:entityType/:entityId - Get activities for a specific entity
router.get('/:entityType/:entityId', getEntityActivities);

export default router;
