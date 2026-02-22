// =============================================
// Shared TypeScript Types for CRM Frontend
// =============================================

// ---- Base Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  total?: number;
  totalPages?: number;
  page?: number;
  [key: string]: unknown;
}

// ---- User & Auth ----
export interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  avatar: string | null;
  phone: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithCounts extends User {
  _count: {
    customers: number;
    deals: number;
    tasksAssigned: number;
  };
}

export interface PlatformStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  entities: {
    customers: number;
    deals: number;
    tasks: number;
  };
  revenue: {
    totalWon: number;
    dealsWon: number;
  };
}

// ---- Customer ----
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: CustomerStatus;
  notes: string | null;
  source: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Deal ----
export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string | null;
  closedAt: string | null;
  customerId: string;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

// ---- Task ----
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskType = 'CALL' | 'EMAIL' | 'MEETING' | 'FOLLOW_UP' | 'OTHER';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  customerId: string | null;
  dealId: string | null;
  customer?: Customer | null;
  deal?: Deal | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Notification ----
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ---- Contact ----
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  isPrimary: boolean;
  customerId: string;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

// ---- Product ----
export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  currency: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Quote ----
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface LineItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: Product;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerId: string;
  dealId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  items: LineItem[];
  customer?: Customer;
  deal?: Deal;
  createdAt: string;
  updatedAt: string;
}

// ---- Team ----
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  user?: User;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
  createdAt: string;
}

// ---- Custom Fields ----
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'URL' | 'EMAIL' | 'PHONE';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  entity: string;
  options: string[];
  required: boolean;
  defaultValue: string | null;
  order: number;
  createdAt: string;
}

export interface CustomFieldValue {
  id: string;
  fieldId: string;
  entityId: string;
  value: string;
  field?: CustomField;
}

// ---- Dashboard ----
export interface DashboardStats {
  totalCustomers: number;
  totalDeals: number;
  totalTasks: number;
  revenue: number;
  pipelineValue: number;
  pendingTasks: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  recentDeals: Deal[];
  recentTasks: Task[];
}

// ---- Activity ----
export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityType: string;
  entityId: string;
  createdAt: string;
}

// ---- Note ----
export interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  customerId: string | null;
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Email Template ----
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  createdAt: string;
}

// ---- Workflow ----
export interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

// ---- Webhook ----
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---- Audit Log ----
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  user?: { name: string; email: string };
  createdAt: string;
}

// ---- Metrics ----
export interface AppMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  requests: {
    total: number;
    perSecond: number;
    avgResponseTime: number;
    p95ResponseTime: number;
  };
  statusCodes: Record<string, number>;
  slowEndpoints: Array<{ path: string; avgTime: number; count: number }>;
}

// ---- Preferences ----
export interface UserPreferences {
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dealAlerts: boolean;
  taskReminders: boolean;
  weeklyReport: boolean;
  compactView: boolean;
  defaultDashboard: string;
  emailTaskReminders?: boolean;
  emailDealUpdates?: boolean;
  emailWeeklyDigest?: boolean;
  pushTaskReminders?: boolean;
  pushDealWon?: boolean;
  pushNewCustomer?: boolean;
  emailSignature?: string;
  defaultCc?: string;
  replyTo?: string;
}

// ---- Params ----
export interface ListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerListParams extends ListParams {
  status?: string;
}

export interface DealListParams extends ListParams {
  stage?: string;
}

export interface TaskListParams extends ListParams {
  status?: string;
  priority?: string;
}

export interface UserListParams extends ListParams {
  role?: string;
  isActive?: string;
}
