import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendEmailSchema, emailTemplateSchema } from '../lib/validators';
import {
  sendEmailToCustomer,
  getEmailHistory,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../controllers/emailController';

const router = Router();

// All routes require authentication
router.use(protect);

// POST /api/emails/send - Send an email
router.post('/send', validate(sendEmailSchema), sendEmailToCustomer);

// GET /api/emails/history - Get email history
router.get('/history', getEmailHistory);

// Email Templates
// GET /api/emails/templates - Get all templates
router.get('/templates', getEmailTemplates);

// POST /api/emails/templates - Create template
router.post('/templates', validate(emailTemplateSchema), createEmailTemplate);

// PUT /api/emails/templates/:id - Update template
router.put('/templates/:id', validate(emailTemplateSchema.partial()), updateEmailTemplate);

// DELETE /api/emails/templates/:id - Delete template
router.delete('/templates/:id', deleteEmailTemplate);

export default router;
