// =============================================
// Shared TypeScript Types for CRM Mobile
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  totalPages?: number;
  page?: number;
}

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

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

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

export interface Team {
  id: string;
  name: string;
  description: string | null;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user?: User;
    joinedAt: string;
  }>;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  customerId: string | null;
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  type: string;
  status: string;
  customerId: string | null;
  dealId: string | null;
  customer?: Customer;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalDeals: number;
  totalTasks: number;
  revenue: number;
  pipelineValue: number;
  pendingTasks: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dealAlerts: boolean;
  taskReminders: boolean;
  weeklyReport: boolean;
  compactView: boolean;
}
