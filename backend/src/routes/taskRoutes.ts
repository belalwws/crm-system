import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Task Routes
 * All routes are protected (require authentication)
 */
router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

export default router;
