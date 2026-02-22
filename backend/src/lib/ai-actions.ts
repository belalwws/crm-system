/**
 * AI Action Execution Engine
 * Allows the AI to execute CRM CRUD operations
 * 
 * The AI returns structured JSON action blocks in its responses.
 * This engine parses those blocks and executes them against the database.
 */

import prisma from './prisma';
import logger from './logger';
import { z } from 'zod';

// =============================================
// Validation Schemas for AI Actions
// =============================================

const emailSchema = z.string().email().max(255);
const nameSchema = z.string().min(1).max(200).trim();
const phoneSchema = z.string().max(30).optional().nullable();
const companySchema = z.string().max(200).optional().nullable();
const industrySchema = z.string().max(100).optional().nullable();
const customerStatusSchema = z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional();
const sourceSchema = z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'TRADE_SHOW', 'PARTNER', 'OTHER']).optional().nullable();
const dealStageSchema = z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional();
const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional();
const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional();
const taskTypeSchema = z.enum(['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'WHATSAPP', 'OTHER']).optional();
const limitSchema = z.number().int().min(1).max(100).optional();
const idSchema = z.string().min(1).max(100).optional();
const searchSchema = z.string().max(200).optional();

const createCustomerActionSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: companySchema,
  status: customerStatusSchema,
  source: sourceSchema,
  industry: industrySchema,
});

const updateCustomerActionSchema = z.object({
  id: idSchema,
  searchName: searchSchema,
  searchEmail: searchSchema,
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: phoneSchema,
  company: companySchema,
  status: customerStatusSchema,
});

const deleteCustomerActionSchema = z.object({
  id: idSchema,
  searchName: searchSchema,
  searchEmail: searchSchema,
});

const listCustomersActionSchema = z.object({
  search: searchSchema,
  status: customerStatusSchema,
  limit: limitSchema,
});

const createDealActionSchema = z.object({
  title: z.string().min(1).max(300),
  value: z.number().min(0).optional(),
  customerId: idSchema,
  customerName: searchSchema,
  stage: dealStageSchema,
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().max(50).optional(),
  description: z.string().max(5000).optional().nullable(),
});

const updateDealActionSchema = z.object({
  id: idSchema,
  searchTitle: searchSchema,
  title: z.string().min(1).max(300).optional(),
  value: z.number().min(0).optional(),
  stage: dealStageSchema,
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().max(50).optional(),
});

const deleteDealActionSchema = z.object({
  id: idSchema,
  searchTitle: searchSchema,
});

const listDealsActionSchema = z.object({
  search: searchSchema,
  stage: dealStageSchema,
  limit: limitSchema,
});

const createTaskActionSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: z.string().max(50).optional(),
  type: taskTypeSchema,
  customerName: searchSchema,
  dealTitle: searchSchema,
});

const updateTaskActionSchema = z.object({
  id: idSchema,
  searchTitle: searchSchema,
  title: z.string().min(1).max(300).optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.string().max(50).optional(),
});

const deleteTaskActionSchema = z.object({
  id: idSchema,
  searchTitle: searchSchema,
});

const listTasksActionSchema = z.object({
  search: searchSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  limit: limitSchema,
});

// Map action names to their validation schemas
const ACTION_SCHEMAS: Record<string, z.ZodSchema> = {
  CREATE_CUSTOMER: createCustomerActionSchema,
  UPDATE_CUSTOMER: updateCustomerActionSchema,
  DELETE_CUSTOMER: deleteCustomerActionSchema,
  LIST_CUSTOMERS: listCustomersActionSchema,
  CREATE_DEAL: createDealActionSchema,
  UPDATE_DEAL: updateDealActionSchema,
  DELETE_DEAL: deleteDealActionSchema,
  LIST_DEALS: listDealsActionSchema,
  CREATE_TASK: createTaskActionSchema,
  UPDATE_TASK: updateTaskActionSchema,
  DELETE_TASK: deleteTaskActionSchema,
  LIST_TASKS: listTasksActionSchema,
  GET_DASHBOARD_STATS: z.object({}),
};

// =============================================
// Action Definitions - Available CRM Operations
// =============================================

export interface ActionDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; required?: boolean; description: string; enum?: string[] }>;
}

export const CRM_ACTIONS: ActionDefinition[] = [
  {
    name: 'CREATE_CUSTOMER',
    description: 'Create a new customer/lead in the CRM',
    parameters: {
      name: { type: 'string', required: true, description: 'Full name of the customer' },
      email: { type: 'string', required: true, description: 'Email address' },
      phone: { type: 'string', required: false, description: 'Phone number' },
      company: { type: 'string', required: false, description: 'Company name' },
      status: { type: 'string', required: false, description: 'Customer status', enum: ['LEAD', 'ACTIVE', 'INACTIVE'] },
      source: { type: 'string', required: false, description: 'Lead source', enum: ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'TRADE_SHOW', 'PARTNER', 'OTHER'] },
      industry: { type: 'string', required: false, description: 'Industry' },
    },
  },
  {
    name: 'UPDATE_CUSTOMER',
    description: 'Update an existing customer by ID or by searching by name/email',
    parameters: {
      id: { type: 'string', required: false, description: 'Customer ID (if known)' },
      searchName: { type: 'string', required: false, description: 'Search by customer name (if ID unknown)' },
      searchEmail: { type: 'string', required: false, description: 'Search by customer email (if ID unknown)' },
      name: { type: 'string', required: false, description: 'New name' },
      email: { type: 'string', required: false, description: 'New email' },
      phone: { type: 'string', required: false, description: 'New phone' },
      company: { type: 'string', required: false, description: 'New company' },
      status: { type: 'string', required: false, description: 'New status', enum: ['LEAD', 'ACTIVE', 'INACTIVE'] },
    },
  },
  {
    name: 'DELETE_CUSTOMER',
    description: 'Soft-delete a customer (move to trash)',
    parameters: {
      id: { type: 'string', required: false, description: 'Customer ID' },
      searchName: { type: 'string', required: false, description: 'Search by name' },
      searchEmail: { type: 'string', required: false, description: 'Search by email' },
    },
  },
  {
    name: 'LIST_CUSTOMERS',
    description: 'List/search customers with optional filters',
    parameters: {
      search: { type: 'string', required: false, description: 'Search term for name/email/company' },
      status: { type: 'string', required: false, description: 'Filter by status', enum: ['LEAD', 'ACTIVE', 'INACTIVE'] },
      limit: { type: 'number', required: false, description: 'Max results (default 10)' },
    },
  },
  {
    name: 'CREATE_DEAL',
    description: 'Create a new deal/opportunity',
    parameters: {
      title: { type: 'string', required: true, description: 'Deal title' },
      value: { type: 'number', required: true, description: 'Deal monetary value' },
      customerId: { type: 'string', required: false, description: 'Customer ID to associate' },
      customerName: { type: 'string', required: false, description: 'Customer name (to search if no ID)' },
      stage: { type: 'string', required: false, description: 'Deal stage', enum: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] },
      probability: { type: 'number', required: false, description: 'Win probability (0-100)' },
      expectedCloseDate: { type: 'string', required: false, description: 'Expected close date (ISO format)' },
      description: { type: 'string', required: false, description: 'Deal description' },
    },
  },
  {
    name: 'UPDATE_DEAL',
    description: 'Update an existing deal',
    parameters: {
      id: { type: 'string', required: false, description: 'Deal ID' },
      searchTitle: { type: 'string', required: false, description: 'Search by deal title' },
      title: { type: 'string', required: false, description: 'New title' },
      value: { type: 'number', required: false, description: 'New value' },
      stage: { type: 'string', required: false, description: 'New stage', enum: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] },
      probability: { type: 'number', required: false, description: 'New probability' },
      expectedCloseDate: { type: 'string', required: false, description: 'New expected close date' },
    },
  },
  {
    name: 'DELETE_DEAL',
    description: 'Soft-delete a deal',
    parameters: {
      id: { type: 'string', required: false, description: 'Deal ID' },
      searchTitle: { type: 'string', required: false, description: 'Search by title' },
    },
  },
  {
    name: 'LIST_DEALS',
    description: 'List/search deals with optional filters',
    parameters: {
      search: { type: 'string', required: false, description: 'Search term for title' },
      stage: { type: 'string', required: false, description: 'Filter by stage', enum: ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] },
      limit: { type: 'number', required: false, description: 'Max results (default 10)' },
    },
  },
  {
    name: 'CREATE_TASK',
    description: 'Create a new task',
    parameters: {
      title: { type: 'string', required: true, description: 'Task title' },
      description: { type: 'string', required: false, description: 'Task description' },
      priority: { type: 'string', required: false, description: 'Priority level', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      status: { type: 'string', required: false, description: 'Task status', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      dueDate: { type: 'string', required: false, description: 'Due date (ISO format)' },
      type: { type: 'string', required: false, description: 'Task type', enum: ['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'WHATSAPP', 'OTHER'] },
      customerName: { type: 'string', required: false, description: 'Customer name to link' },
      dealTitle: { type: 'string', required: false, description: 'Deal title to link' },
    },
  },
  {
    name: 'UPDATE_TASK',
    description: 'Update an existing task',
    parameters: {
      id: { type: 'string', required: false, description: 'Task ID' },
      searchTitle: { type: 'string', required: false, description: 'Search by task title' },
      title: { type: 'string', required: false, description: 'New title' },
      status: { type: 'string', required: false, description: 'New status', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      priority: { type: 'string', required: false, description: 'New priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      dueDate: { type: 'string', required: false, description: 'New due date' },
    },
  },
  {
    name: 'DELETE_TASK',
    description: 'Soft-delete a task',
    parameters: {
      id: { type: 'string', required: false, description: 'Task ID' },
      searchTitle: { type: 'string', required: false, description: 'Search by title' },
    },
  },
  {
    name: 'LIST_TASKS',
    description: 'List/search tasks with optional filters',
    parameters: {
      search: { type: 'string', required: false, description: 'Search term' },
      status: { type: 'string', required: false, description: 'Filter by status', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      priority: { type: 'string', required: false, description: 'Filter by priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      limit: { type: 'number', required: false, description: 'Max results (default 10)' },
    },
  },
  {
    name: 'GET_DASHBOARD_STATS',
    description: 'Get dashboard statistics summary (customers, deals, tasks, revenue)',
    parameters: {},
  },
];

// =============================================
// Action Prompt Builder
// =============================================

export function buildActionSystemPrompt(): string {
  const actionDescriptions = CRM_ACTIONS.map(action => {
    const params = Object.entries(action.parameters)
      .map(([key, p]) => `    - ${key} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}${p.enum ? ` [${p.enum.join(', ')}]` : ''}`)
      .join('\n');
    return `  ${action.name}: ${action.description}\n${params || '    (no parameters)'}`;
  }).join('\n\n');

  return `You are "Nexus AI", a powerful CRM assistant that can both answer questions AND execute CRM operations directly.

## Your Capabilities:
1. **Answer questions** about CRM, sales, business strategy
2. **Execute CRM actions** - Create, Read, Update, Delete customers, deals, and tasks
3. **Analyze data** - Provide insights on customers, deals, performance
4. **Write content** - Emails, follow-ups, reports

## Available CRM Actions:
When the user asks you to perform a CRM operation (create, update, delete, list, search), you MUST respond with an action block.

${actionDescriptions}

## How to Execute Actions:
When you need to perform a CRM operation, include an ACTION block in your response using this EXACT format:

\`\`\`action
{
  "action": "ACTION_NAME",
  "params": { ... }
}
\`\`\`

## Important Rules:
1. **Always confirm before destructive operations** (delete) unless the user explicitly says "delete" or "remove"
2. You can include MULTIPLE action blocks in one response if needed
3. Include a brief natural language explanation BEFORE the action block
4. After action blocks, the system will execute them and provide results
5. When listing/searching, present the results in a clean formatted way
6. If a user mentions a customer/deal/task by name but you don't have the ID, use the search parameters
7. Be smart about interpreting commands: "add a customer named John" → CREATE_CUSTOMER, "move deal X to proposal" → UPDATE_DEAL with stage PROPOSAL
8. For dates, convert relative dates: "tomorrow" → actual date, "next week" → actual date, "in 3 days" → actual date. Today is ${new Date().toISOString().split('T')[0]}
9. When you receive action results, interpret them and respond naturally to the user
10. Always use a professional but friendly tone
11. When creating items, confirm what was created with key details
12. Respond in the same language as the user (if Arabic, respond in Arabic; if English, respond in English)`;
}

// =============================================
// Action Parser - Extract actions from AI response
// =============================================

export interface ParsedAction {
  action: string;
  params: Record<string, any>;
}

export function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const actions: ParsedAction[] = [];
  
  // Match ```action ... ``` blocks
  const actionRegex = /```action\s*\n?([\s\S]*?)```/g;
  let match;
  let cleanText = content;

  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.action && typeof parsed.action === 'string') {
        actions.push({
          action: parsed.action,
          params: parsed.params || {},
        });
      }
    } catch (e) {
      logger.warn('Failed to parse action block:', match[1]);
    }
    cleanText = cleanText.replace(match[0], '');
  }

  return { text: cleanText.trim(), actions };
}

// =============================================
// Action Executor
// =============================================

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
}

export async function executeAction(
  action: ParsedAction,
  userId: string
): Promise<ActionResult> {
  try {
    // Validate action params with Zod before execution
    const schema = ACTION_SCHEMAS[action.action];
    if (schema) {
      const validation = schema.safeParse(action.params);
      if (!validation.success) {
        const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, action: action.action, message: `Invalid parameters: ${errors}` };
      }
      action.params = validation.data as Record<string, any>;
    }

    switch (action.action) {
      // ---- CUSTOMERS ----
      case 'CREATE_CUSTOMER':
        return await createCustomer(action.params, userId);
      case 'UPDATE_CUSTOMER':
        return await updateCustomer(action.params, userId);
      case 'DELETE_CUSTOMER':
        return await deleteCustomer(action.params, userId);
      case 'LIST_CUSTOMERS':
        return await listCustomers(action.params, userId);

      // ---- DEALS ----
      case 'CREATE_DEAL':
        return await createDeal(action.params, userId);
      case 'UPDATE_DEAL':
        return await updateDeal(action.params, userId);
      case 'DELETE_DEAL':
        return await deleteDeal(action.params, userId);
      case 'LIST_DEALS':
        return await listDeals(action.params, userId);

      // ---- TASKS ----
      case 'CREATE_TASK':
        return await createTask(action.params, userId);
      case 'UPDATE_TASK':
        return await updateTask(action.params, userId);
      case 'DELETE_TASK':
        return await deleteTask(action.params, userId);
      case 'LIST_TASKS':
        return await listTasks(action.params, userId);

      // ---- DASHBOARD ----
      case 'GET_DASHBOARD_STATS':
        return await getDashboardStats(userId);

      default:
        return { success: false, action: action.action, message: `Unknown action: ${action.action}` };
    }
  } catch (error: any) {
    logger.error(`Action execution error [${action.action}]:`, error);
    return { success: false, action: action.action, message: error.message || 'Action execution failed' };
  }
}

// =============================================
// Customer Actions
// =============================================

async function createCustomer(params: Record<string, any>, userId: string): Promise<ActionResult> {
  if (!params.name || !params.email) {
    return { success: false, action: 'CREATE_CUSTOMER', message: 'Name and email are required to create a customer' };
  }

  const customer = await prisma.customer.create({
    data: {
      name: params.name,
      email: params.email,
      phone: params.phone || null,
      company: params.company || null,
      status: params.status || 'LEAD',
      source: params.source || null,
      industry: params.industry || null,
      ownerId: userId,
    },
  });

  return {
    success: true,
    action: 'CREATE_CUSTOMER',
    message: `Customer "${customer.name}" created successfully`,
    data: { id: customer.id, name: customer.name, email: customer.email, status: customer.status, company: customer.company },
  };
}

async function updateCustomer(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let customerId = params.id;

  if (!customerId) {
    const where: any = { ownerId: userId, deletedAt: null };
    if (params.searchName) where.name = { contains: params.searchName, mode: 'insensitive' };
    else if (params.searchEmail) where.email = { contains: params.searchEmail, mode: 'insensitive' };
    else return { success: false, action: 'UPDATE_CUSTOMER', message: 'Please provide a customer ID, name, or email to search' };

    const customer = await prisma.customer.findFirst({ where });
    if (!customer) return { success: false, action: 'UPDATE_CUSTOMER', message: 'Customer not found' };
    customerId = customer.id;
  }

  const updateData: any = {};
  if (params.name) updateData.name = params.name;
  if (params.email) updateData.email = params.email;
  if (params.phone !== undefined) updateData.phone = params.phone;
  if (params.company !== undefined) updateData.company = params.company;
  if (params.status) updateData.status = params.status;

  if (Object.keys(updateData).length === 0) {
    return { success: false, action: 'UPDATE_CUSTOMER', message: 'No fields to update' };
  }

  const customer = await prisma.customer.update({
    where: { id: customerId, ownerId: userId },
    data: updateData,
  });

  return {
    success: true,
    action: 'UPDATE_CUSTOMER',
    message: `Customer "${customer.name}" updated successfully`,
    data: { id: customer.id, name: customer.name, email: customer.email, status: customer.status },
  };
}

async function deleteCustomer(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let customerId = params.id;

  if (!customerId) {
    const where: any = { ownerId: userId, deletedAt: null };
    if (params.searchName) where.name = { contains: params.searchName, mode: 'insensitive' };
    else if (params.searchEmail) where.email = { contains: params.searchEmail, mode: 'insensitive' };
    else return { success: false, action: 'DELETE_CUSTOMER', message: 'Please provide a customer ID, name, or email' };

    const customer = await prisma.customer.findFirst({ where });
    if (!customer) return { success: false, action: 'DELETE_CUSTOMER', message: 'Customer not found' };
    customerId = customer.id;
  }

  // Soft delete
  const customer = await prisma.customer.update({
    where: { id: customerId, ownerId: userId },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  return {
    success: true,
    action: 'DELETE_CUSTOMER',
    message: `Customer "${customer.name}" moved to trash`,
    data: { id: customer.id, name: customer.name },
  };
}

async function listCustomers(params: Record<string, any>, userId: string): Promise<ActionResult> {
  const where: any = { ownerId: userId, deletedAt: null };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { company: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.status) where.status = params.status;

  const customers = await prisma.customer.findMany({
    where,
    take: params.limit || 10,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      status: true,
      createdAt: true,
      _count: { select: { deals: true, tasks: true } },
    },
  });

  return {
    success: true,
    action: 'LIST_CUSTOMERS',
    message: `Found ${customers.length} customer(s)`,
    data: customers,
  };
}

// =============================================
// Deal Actions
// =============================================

async function createDeal(params: Record<string, any>, userId: string): Promise<ActionResult> {
  if (!params.title) {
    return { success: false, action: 'CREATE_DEAL', message: 'Deal title is required' };
  }

  // Resolve customer
  let customerId = params.customerId;
  if (!customerId && params.customerName) {
    const customer = await prisma.customer.findFirst({
      where: { ownerId: userId, deletedAt: null, name: { contains: params.customerName, mode: 'insensitive' } },
    });
    if (customer) customerId = customer.id;
    else return { success: false, action: 'CREATE_DEAL', message: `Customer "${params.customerName}" not found. Create the customer first.` };
  }

  if (!customerId) {
    return { success: false, action: 'CREATE_DEAL', message: 'A customer must be associated with the deal. Provide customerId or customerName.' };
  }

  const deal = await prisma.deal.create({
    data: {
      title: params.title,
      value: params.value || 0,
      stage: params.stage || 'LEAD',
      probability: params.probability || 10,
      expectedCloseDate: params.expectedCloseDate ? new Date(params.expectedCloseDate) : null,
      description: params.description || null,
      ownerId: userId,
      customerId,
    },
    include: { customer: { select: { name: true } } },
  });

  return {
    success: true,
    action: 'CREATE_DEAL',
    message: `Deal "${deal.title}" created for ${deal.customer.name} worth $${deal.value}`,
    data: { id: deal.id, title: deal.title, value: Number(deal.value), stage: deal.stage, customer: deal.customer.name },
  };
}

async function updateDeal(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let dealId = params.id;

  if (!dealId) {
    if (params.searchTitle) {
      const deal = await prisma.deal.findFirst({
        where: { ownerId: userId, deletedAt: null, title: { contains: params.searchTitle, mode: 'insensitive' } },
      });
      if (!deal) return { success: false, action: 'UPDATE_DEAL', message: `Deal "${params.searchTitle}" not found` };
      dealId = deal.id;
    } else {
      return { success: false, action: 'UPDATE_DEAL', message: 'Please provide a deal ID or title to search' };
    }
  }

  const updateData: any = {};
  if (params.title) updateData.title = params.title;
  if (params.value !== undefined) updateData.value = params.value;
  if (params.stage) updateData.stage = params.stage;
  if (params.probability !== undefined) updateData.probability = params.probability;
  if (params.expectedCloseDate) updateData.expectedCloseDate = new Date(params.expectedCloseDate);

  if (Object.keys(updateData).length === 0) {
    return { success: false, action: 'UPDATE_DEAL', message: 'No fields to update' };
  }

  const deal = await prisma.deal.update({
    where: { id: dealId, ownerId: userId },
    data: updateData,
    include: { customer: { select: { name: true } } },
  });

  return {
    success: true,
    action: 'UPDATE_DEAL',
    message: `Deal "${deal.title}" updated successfully`,
    data: { id: deal.id, title: deal.title, value: Number(deal.value), stage: deal.stage, customer: deal.customer.name },
  };
}

async function deleteDeal(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let dealId = params.id;

  if (!dealId) {
    if (params.searchTitle) {
      const deal = await prisma.deal.findFirst({
        where: { ownerId: userId, deletedAt: null, title: { contains: params.searchTitle, mode: 'insensitive' } },
      });
      if (!deal) return { success: false, action: 'DELETE_DEAL', message: `Deal "${params.searchTitle}" not found` };
      dealId = deal.id;
    } else {
      return { success: false, action: 'DELETE_DEAL', message: 'Please provide a deal ID or title' };
    }
  }

  const deal = await prisma.deal.update({
    where: { id: dealId, ownerId: userId },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  return {
    success: true,
    action: 'DELETE_DEAL',
    message: `Deal "${deal.title}" moved to trash`,
    data: { id: deal.id, title: deal.title },
  };
}

async function listDeals(params: Record<string, any>, userId: string): Promise<ActionResult> {
  const where: any = { ownerId: userId, deletedAt: null };
  if (params.search) {
    where.title = { contains: params.search, mode: 'insensitive' };
  }
  if (params.stage) where.stage = params.stage;

  const deals = await prisma.deal.findMany({
    where,
    take: params.limit || 10,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      value: true,
      stage: true,
      probability: true,
      expectedCloseDate: true,
      customer: { select: { name: true, company: true } },
      createdAt: true,
    },
  });

  return {
    success: true,
    action: 'LIST_DEALS',
    message: `Found ${deals.length} deal(s)`,
    data: deals.map(d => ({ ...d, value: Number(d.value) })),
  };
}

// =============================================
// Task Actions
// =============================================

async function createTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
  if (!params.title) {
    return { success: false, action: 'CREATE_TASK', message: 'Task title is required' };
  }

  let customerId: string | null = null;
  let dealId: string | null = null;

  if (params.customerName) {
    const customer = await prisma.customer.findFirst({
      where: { ownerId: userId, deletedAt: null, name: { contains: params.customerName, mode: 'insensitive' } },
    });
    if (customer) customerId = customer.id;
  }

  if (params.dealTitle) {
    const deal = await prisma.deal.findFirst({
      where: { ownerId: userId, deletedAt: null, title: { contains: params.dealTitle, mode: 'insensitive' } },
    });
    if (deal) dealId = deal.id;
  }

  const task = await prisma.task.create({
    data: {
      title: params.title,
      description: params.description || null,
      priority: params.priority || 'MEDIUM',
      status: params.status || 'PENDING',
      type: params.type || 'OTHER',
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
      assignedToId: userId,
      createdById: userId,
      customerId,
      dealId,
    },
  });

  return {
    success: true,
    action: 'CREATE_TASK',
    message: `Task "${task.title}" created (${task.priority} priority, due ${task.dueDate ? task.dueDate.toLocaleDateString() : 'no date'})`,
    data: { id: task.id, title: task.title, priority: task.priority, status: task.status, dueDate: task.dueDate },
  };
}

async function updateTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let taskId = params.id;

  if (!taskId) {
    if (params.searchTitle) {
      const task = await prisma.task.findFirst({
        where: { assignedToId: userId, deletedAt: null, title: { contains: params.searchTitle, mode: 'insensitive' } },
      });
      if (!task) return { success: false, action: 'UPDATE_TASK', message: `Task "${params.searchTitle}" not found` };
      taskId = task.id;
    } else {
      return { success: false, action: 'UPDATE_TASK', message: 'Please provide a task ID or title' };
    }
  }

  const updateData: any = {};
  if (params.title) updateData.title = params.title;
  if (params.status) {
    updateData.status = params.status;
    if (params.status === 'COMPLETED') updateData.completedDate = new Date();
  }
  if (params.priority) updateData.priority = params.priority;
  if (params.dueDate) updateData.dueDate = new Date(params.dueDate);

  if (Object.keys(updateData).length === 0) {
    return { success: false, action: 'UPDATE_TASK', message: 'No fields to update' };
  }

  const task = await prisma.task.update({
    where: { id: taskId, assignedToId: userId },
    data: updateData,
  });

  return {
    success: true,
    action: 'UPDATE_TASK',
    message: `Task "${task.title}" updated (${task.status}, ${task.priority})`,
    data: { id: task.id, title: task.title, status: task.status, priority: task.priority },
  };
}

async function deleteTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
  let taskId = params.id;

  if (!taskId) {
    if (params.searchTitle) {
      const task = await prisma.task.findFirst({
        where: { assignedToId: userId, deletedAt: null, title: { contains: params.searchTitle, mode: 'insensitive' } },
      });
      if (!task) return { success: false, action: 'DELETE_TASK', message: `Task "${params.searchTitle}" not found` };
      taskId = task.id;
    } else {
      return { success: false, action: 'DELETE_TASK', message: 'Please provide a task ID or title' };
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId, assignedToId: userId },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  return {
    success: true,
    action: 'DELETE_TASK',
    message: `Task "${task.title}" moved to trash`,
    data: { id: task.id, title: task.title },
  };
}

async function listTasks(params: Record<string, any>, userId: string): Promise<ActionResult> {
  const where: any = { assignedToId: userId, deletedAt: null };
  if (params.search) {
    where.title = { contains: params.search, mode: 'insensitive' };
  }
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;

  const tasks = await prisma.task.findMany({
    where,
    take: params.limit || 10,
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      type: true,
      customer: { select: { name: true } },
      deal: { select: { title: true } },
    },
  });

  return {
    success: true,
    action: 'LIST_TASKS',
    message: `Found ${tasks.length} task(s)`,
    data: tasks,
  };
}

// =============================================
// Dashboard Stats
// =============================================

async function getDashboardStats(userId: string): Promise<ActionResult> {
  const [
    totalCustomers,
    activeCustomers,
    leads,
    totalDeals,
    wonDeals,
    lostDeals,
    pendingTasks,
    overdueTasks,
    dealValues,
    wonValues,
  ] = await Promise.all([
    prisma.customer.count({ where: { ownerId: userId, deletedAt: null } }),
    prisma.customer.count({ where: { ownerId: userId, deletedAt: null, status: 'ACTIVE' } }),
    prisma.customer.count({ where: { ownerId: userId, deletedAt: null, status: 'LEAD' } }),
    prisma.deal.count({ where: { ownerId: userId, deletedAt: null } }),
    prisma.deal.count({ where: { ownerId: userId, deletedAt: null, stage: 'CLOSED_WON' } }),
    prisma.deal.count({ where: { ownerId: userId, deletedAt: null, stage: 'CLOSED_LOST' } }),
    prisma.task.count({ where: { assignedToId: userId, deletedAt: null, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.task.count({
      where: {
        assignedToId: userId,
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.deal.aggregate({ where: { ownerId: userId, deletedAt: null }, _sum: { value: true } }),
    prisma.deal.aggregate({ where: { ownerId: userId, deletedAt: null, stage: 'CLOSED_WON' }, _sum: { value: true } }),
  ]);

  return {
    success: true,
    action: 'GET_DASHBOARD_STATS',
    message: 'Dashboard statistics retrieved',
    data: {
      customers: { total: totalCustomers, active: activeCustomers, leads },
      deals: {
        total: totalDeals,
        won: wonDeals,
        lost: lostDeals,
        pipelineValue: Number(dealValues._sum.value) || 0,
        wonValue: Number(wonValues._sum.value) || 0,
        winRate: totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) + '%' : '0%',
      },
      tasks: { pending: pendingTasks, overdue: overdueTasks },
    },
  };
}

export { CRM_ACTIONS as crmActions };
