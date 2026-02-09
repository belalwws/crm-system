import { z } from 'zod';

// ===========================
// Auth Schemas
// ===========================
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  company: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ===========================
// Customer Schemas
// ===========================
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD']).optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'TRADE_SHOW', 'PARTNER', 'OTHER']).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notesText: z.string().max(5000).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ===========================
// Deal Schemas
// ===========================
export const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  value: z.number().min(0, 'Value must be non-negative').optional(),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().or(z.string().pipe(z.coerce.date())).optional().nullable(),
  lostReason: z.string().max(1000).optional().nullable(),
  notesText: z.string().max(5000).optional().nullable(),
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const updateDealSchema = createDealSchema.partial().omit({ customerId: true }).extend({
  customerId: z.string().optional(),
});

// ===========================
// Task Schemas
// ===========================
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'WHATSAPP', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().or(z.string().pipe(z.coerce.date())).optional().nullable(),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  assignedToId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// ===========================
// Email Schemas
// ===========================
export const sendEmailSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  dealId: z.string().optional().nullable(),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Email body is required').max(50000),
  templateId: z.string().optional(),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(50000),
  category: z.string().max(100).optional().nullable(),
});

// ===========================
// Note Schemas
// ===========================
export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(10000),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  pinned: z.boolean().optional(),
  mentions: z.array(z.string()).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

// ===========================
// Meeting Schemas
// ===========================
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  startTime: z.string().datetime().or(z.string().pipe(z.coerce.date())),
  endTime: z.string().datetime().or(z.string().pipe(z.coerce.date())),
  reminder: z.number().int().min(0).optional().nullable(),
  outcome: z.string().max(5000).optional().nullable(),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  startTime: z.string().datetime().or(z.string().pipe(z.coerce.date())).optional(),
  endTime: z.string().datetime().or(z.string().pipe(z.coerce.date())).optional(),
  reminder: z.number().int().min(0).optional().nullable(),
  outcome: z.string().max(5000).optional().nullable(),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

// ===========================
// Document Schemas
// ===========================
export const uploadDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(300),
  type: z.string().min(1, 'Document type is required'),
  size: z.number().int().min(0).optional(),
  url: z.string().min(1, 'URL is required'),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

// ===========================
// Workflow Schemas
// ===========================
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  trigger: z.enum([
    'DEAL_STAGE_CHANGED', 'DEAL_CREATED', 'DEAL_UPDATED',
    'TASK_OVERDUE', 'CUSTOMER_STATUS_CHANGED', 'CUSTOMER_CREATED',
  ]),
  conditions: z.any(), // JSON conditions
  actions: z.array(z.object({
    type: z.enum(['CREATE_TASK', 'SEND_NOTIFICATION', 'UPDATE_FIELD', 'MOVE_STAGE', 'ADD_TAG', 'ASSIGN_TO']),
    params: z.record(z.string(), z.any()),
  })).min(1, 'At least one action is required'),
  isActive: z.boolean().optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

// ===========================
// Webhook Schemas
// ===========================
export const createWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(200),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

// ===========================
// Search & Pagination
// ===========================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  type: z.enum(['customers', 'deals', 'tasks', 'all']).optional().default('all'),
});

// ===========================
// Timeline Schemas
// ===========================
export const createTimelineEntrySchema = z.object({
  type: z.enum([
    'NOTE', 'CALL', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'MEETING', 'WHATSAPP',
    'STAGE_CHANGED', 'STATUS_CHANGED', 'TASK_CREATED', 'TASK_COMPLETED',
    'FILE_UPLOADED', 'DEAL_CREATED', 'DEAL_WON', 'DEAL_LOST', 'MENTION', 'SYSTEM',
  ]),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  metadata: z.any().optional(),
  customerId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

// ===========================
// Saved View Schemas
// ===========================
export const createSavedViewSchema = z.object({
  name: z.string().min(1, 'View name is required').max(100),
  entity: z.enum(['customers', 'deals', 'tasks']),
  filters: z.any(),
  sorting: z.any().optional(),
  columns: z.any().optional(),
  isDefault: z.boolean().optional(),
  color: z.string().max(20).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

export const updateSavedViewSchema = createSavedViewSchema.partial();

// ===========================
// Admin Schemas
// ===========================
export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  timezone: z.string().max(50).optional().nullable(),
  avatar: z.string().url().or(z.literal('')).optional().nullable(),
  isActive: z.boolean().optional(),
});
