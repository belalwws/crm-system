// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// Customer Types
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead';
  tags?: string[];
  notes?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// Deal Types
export interface Deal {
  _id: string;
  title: string;
  description?: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  customer: Customer | string;
  owner: string;
  expectedCloseDate?: string;
  closedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export interface Task {
  _id: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedDate?: string;
  customer?: Customer | string;
  deal?: Deal | string;
  assignedTo: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    totalDeals: number;
    totalTasks: number;
    pendingTasks: number;
    totalDealValue: number;
    wonDeals: number;
    wonValue: number;
  };
  dealsByStage: Array<{
    _id: string;
    count: number;
    value: number;
  }>;
  recentTasks: Task[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}
