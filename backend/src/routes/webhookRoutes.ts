import express from 'express';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookLogs,
  testWebhook,
} from '../controllers/webhookController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWebhookSchema, updateWebhookSchema } from '../lib/validators';

const router = express.Router();
router.use(protect);

router.route('/').get(getWebhooks).post(validate(createWebhookSchema), createWebhook);
router.route('/:id').put(validate(updateWebhookSchema), updateWebhook).delete(deleteWebhook);
router.get('/:id/logs', getWebhookLogs);
router.post('/:id/test', testWebhook);

export default router;
