// API Client for CRM Mobile — mirrors web API client
import type {
  Customer, Deal, Task, Contact, Product, Quote, Meeting, Note,
  DashboardStats, Notification, ChatSession, UserPreferences, Activity,
  ApiResponse, Team, SearchResults, ChatMessage,
} from './types';

import { Platform } from 'react-native';

// Render deployed backend — hardcoded to avoid Metro env cache issues
const API_URL = 'https://crm-system-71ju.onrender.com/api';

console.log('[API] Base URL:', API_URL);

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  /** Create an AbortController that auto-aborts after `ms` */
  private timeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  /** Quick connectivity test — does NOT require auth, 5s timeout */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const url = API_URL.replace(/\/api$/, '/');
      const resp = await fetch(url, { method: 'GET', signal: this.timeoutSignal(5000) });
      const data = await resp.json();
      return { ok: true, message: data.message || 'Connected' };
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Connection timed out (5s)' : e.message;
      return { ok: false, message: msg };
    }
  }

  /** Demo login using backend's local JWT auth (bypasses Clerk) */
  async demoLogin(): Promise<{
    ok: boolean;
    token?: string;
    user?: { id: string; name: string; email: string; role: string };
    message?: string;
  }> {
    try {
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@nexuscrm.com', password: 'demo123456' }),
        signal: this.timeoutSignal(15000),
      });
      const text = await resp.text();
      let data: any;
      try { data = JSON.parse(text); } catch { return { ok: false, message: 'Non-JSON response' }; }
      if (data.success && data.data?.token) {
        this.token = data.data.token;
        return { ok: true, token: data.data.token, user: data.data.user };
      }
      return { ok: false, message: data.message || 'Login failed' };
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Login timed out — backend may be slow' : e.message;
      return { ok: false, message: msg };
    }
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers, signal: this.timeoutSignal(10000) });
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, message: `Server returned non-JSON response (${response.status})` };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || `Request failed (${response.status})`,
        };
      }

      // Normalize response
      if (data.success !== undefined) {
        return data;
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Request timed out (10s)' };
      }
      if (error.message === 'Network request failed') {
        return { success: false, message: `Cannot reach server. Ensure the backend is running.` };
      }
      return { success: false, message: error.message || 'Request failed' };
    }
  }

  private buildQuery(params: Record<string, any>): string {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== '') query.set(key, String(val));
    }
    const qs = query.toString();
    return qs ? `?${qs}` : '';
  }

  // Dashboard
  async getDashboardStats() { return this.request<DashboardStats>('/dashboard/stats'); }
  async getRecentActivities() { return this.request<Activity[]>('/dashboard/activities'); }

  // Customers
  async getCustomers(params?: Record<string, any>) {
    return this.request<Customer[]>(`/customers${this.buildQuery(params || {})}`);
  }
  async getCustomer(id: string) { return this.request<Customer>(`/customers/${id}`); }
  async createCustomer(data: Partial<Customer>) {
    return this.request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateCustomer(id: string, data: Partial<Customer>) {
    return this.request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteCustomer(id: string) { return this.request(`/customers/${id}`, { method: 'DELETE' }); }

  // Deals
  async getDeals(params?: Record<string, any>) {
    return this.request<Deal[]>(`/deals${this.buildQuery(params || {})}`);
  }
  async getDeal(id: string) { return this.request<Deal>(`/deals/${id}`); }
  async createDeal(data: Partial<Deal>) {
    return this.request<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateDeal(id: string, data: Partial<Deal>) {
    return this.request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteDeal(id: string) { return this.request(`/deals/${id}`, { method: 'DELETE' }); }

  // Tasks
  async getTasks(params?: Record<string, any>) {
    return this.request<Task[]>(`/tasks${this.buildQuery(params || {})}`);
  }
  async getTask(id: string) { return this.request<Task>(`/tasks/${id}`); }
  async createTask(data: Partial<Task>) {
    return this.request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateTask(id: string, data: Partial<Task>) {
    return this.request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteTask(id: string) { return this.request(`/tasks/${id}`, { method: 'DELETE' }); }

  // Contacts
  async getContacts(customerId?: string) {
    return this.request<Contact[]>(`/contacts${customerId ? `?customerId=${customerId}` : ''}`);
  }
  async createContact(data: Partial<Contact> & { customerId: string }) {
    return this.request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateContact(id: string, data: Partial<Contact>) {
    return this.request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteContact(id: string) { return this.request(`/contacts/${id}`, { method: 'DELETE' }); }

  // Notes
  async getNotes(params?: { customerId?: string; dealId?: string; taskId?: string }) {
    return this.request<Note[]>(`/notes${this.buildQuery(params || {})}`);
  }
  async createNote(data: { title?: string; content: string; customerId?: string; dealId?: string; taskId?: string }) {
    return this.request<Note>('/notes', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteNote(id: string) { return this.request(`/notes/${id}`, { method: 'DELETE' }); }

  // Notifications
  async getNotifications() { return this.request<Notification[]>('/notifications'); }
  async markNotificationRead(id: string) { return this.request(`/notifications/${id}/read`, { method: 'POST' }); }
  async markAllNotificationsRead() { return this.request('/notifications/mark-all-read', { method: 'POST' }); }
  async deleteNotification(id: string) { return this.request(`/notifications/${id}`, { method: 'DELETE' }); }

  // Meetings
  async getMeetings() { return this.request<Meeting[]>('/meetings'); }
  async getMeeting(id: string) { return this.request<Meeting>(`/meetings/${id}`); }
  async getUpcomingMeetings() { return this.request<Meeting[]>('/meetings/upcoming'); }
  async createMeeting(data: Partial<Meeting>) {
    return this.request<Meeting>('/meetings', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateMeeting(id: string, data: Partial<Meeting>) {
    return this.request<Meeting>(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteMeeting(id: string) { return this.request(`/meetings/${id}`, { method: 'DELETE' }); }

  // Products
  async getProducts() { return this.request<Product[]>('/products'); }
  async createProduct(data: Partial<Product>) {
    return this.request<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateProduct(id: string, data: Partial<Product>) {
    return this.request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteProduct(id: string) { return this.request(`/products/${id}`, { method: 'DELETE' }); }

  // Quotes
  async getQuotes() { return this.request<Quote[]>('/quotes'); }
  async getQuote(id: string) { return this.request<Quote>(`/quotes/${id}`); }
  async createQuote(data: Record<string, unknown>) {
    return this.request<Quote>('/quotes', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteQuote(id: string) { return this.request(`/quotes/${id}`, { method: 'DELETE' }); }

  // Teams
  async getTeams() { return this.request<Team[]>('/teams'); }
  async createTeam(data: { name: string; description?: string }) {
    return this.request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteTeam(id: string) { return this.request(`/teams/${id}`, { method: 'DELETE' }); }

  // AI Chat
  async listChatSessions() { return this.request<ChatSession[]>('/ai/sessions'); }
  async createChatSession(title?: string | { title: string }) {
    const t = typeof title === 'object' ? title.title : title;
    return this.request<ChatSession>('/ai/sessions', { method: 'POST', body: JSON.stringify({ title: t }) });
  }
  async getChatSession(sessionId: string) { return this.request<ChatSession>(`/ai/sessions/${sessionId}`); }
  async getChatMessages(sessionId: string) { return this.request<ChatMessage[]>(`/ai/sessions/${sessionId}/messages`); }
  async deleteChatSession(sessionId: string) {
    return this.request(`/ai/sessions/${sessionId}`, { method: 'DELETE' });
  }
  async sendChatMessage(sessionId: string, message: string | { content: string }) {
    const msg = typeof message === 'object' ? message.content : message;
    return this.request(`/ai/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: msg }),
    });
  }

  // AI Features
  async aiCustomerInsights(customerId: string) { return this.request(`/ai/customer-insights/${customerId}`); }
  async getCustomerInsights(customerId: string) { return this.aiCustomerInsights(customerId); }
  async aiDealAnalysis(dealId: string) { return this.request(`/ai/deal-analysis/${dealId}`); }
  async getDealInsights(dealId: string) { return this.aiDealAnalysis(dealId); }
  async aiPrioritizeTasks() { return this.request('/ai/prioritize-tasks'); }
  async aiDashboardInsights() { return this.request('/ai/dashboard-insights'); }

  // Profile
  async getProfile() { return this.request('/profile'); }
  async updateProfile(data: { name?: string; phone?: string; company?: string; timezone?: string }) {
    return this.request('/profile', { method: 'PUT', body: JSON.stringify(data) });
  }
  async getPreferences() { return this.request<UserPreferences>('/profile/preferences'); }
  async updatePreferences(data: Partial<UserPreferences>) {
    return this.request('/profile/preferences', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Search
  async globalSearch(q: string, entity?: string) {
    return this.request<SearchResults>(`/search${this.buildQuery({ q, entity })}`);
  }

  // Reports
  async getConversionFunnel() { return this.request('/reports/funnel'); }
  async getRevenueForecast() { return this.request('/reports/forecast'); }
  async getPerformanceMetrics(days?: number) { return this.request(`/reports/performance${days ? `?days=${days}` : ''}`); }
  async getDashboardReport(period?: string) { return this.request(`/reports/dashboard${period ? `?period=${period}` : ''}`); }

  // Documents
  async getDocuments() { return this.request('/documents'); }
  async deleteDocument(id: string) { return this.request(`/documents/${id}`, { method: 'DELETE' }); }

  // Audit Logs
  async getAuditLogs() { return this.request('/audit-logs'); }

  // Email
  async sendEmail(data: { to: string; subject: string; body: string; customerId?: string }) {
    return this.request('/emails/send', { method: 'POST', body: JSON.stringify(data) });
  }
  async getEmailHistory() { return this.request('/emails/history'); }
}

export const api = new ApiClient();
export default api;
