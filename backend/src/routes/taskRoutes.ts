import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
} from '../controllers/taskController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../lib/validators';

const router = express.Router();

router.use(protect);

router.route('/').get(getTasks).post(validate(createTaskSchema), createTask);
router.route('/:id').get(getTask).put(validate(updateTaskSchema), updateTask).delete(deleteTask);
router.post('/:id/restore', restoreTask);

export default router;
