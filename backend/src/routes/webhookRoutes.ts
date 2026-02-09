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

const router = express.Router();
router.use(protect);

router.route('/').get(getWebhooks).post(createWebhook);
router.route('/:id').put(updateWebhook).delete(deleteWebhook);
router.get('/:id/logs', getWebhookLogs);
router.post('/:id/test', testWebhook);

export default router;
