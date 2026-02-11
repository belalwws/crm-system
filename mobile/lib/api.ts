// API Client for CRM Mobile — mirrors web API client
import Constants from 'expo-constants';
import type {
  Customer, Deal, Task, Contact, Product, Quote, Meeting, Note,
  DashboardStats, Notification, ChatSession, UserPreferences, Activity,
  ApiResponse, Team,
} from './types';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://crm-system-71ju.onrender.com/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
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
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw new Error('No internet connection. Please check your network.');
      }
      throw error;
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
  async getNotes(params?: { customerId?: string; dealId?: string }) {
    return this.request<Note[]>(`/notes${this.buildQuery(params || {})}`);
  }
  async createNote(data: { content: string; customerId?: string; dealId?: string }) {
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
  async createChatSession(title?: string) {
    return this.request<ChatSession>('/ai/sessions', { method: 'POST', body: JSON.stringify({ title }) });
  }
  async getChatSession(sessionId: string) { return this.request<ChatSession>(`/ai/sessions/${sessionId}`); }
  async deleteChatSession(sessionId: string) {
    return this.request(`/ai/sessions/${sessionId}`, { method: 'DELETE' });
  }
  async sendChatMessage(sessionId: string, message: string) {
    return this.request(`/ai/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // AI Features
  async aiCustomerInsights(customerId: string) { return this.request(`/ai/customer-insights/${customerId}`); }
  async aiDealAnalysis(dealId: string) { return this.request(`/ai/deal-analysis/${dealId}`); }
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
    return this.request(`/search${this.buildQuery({ q, entity })}`);
  }

  // Reports
  async getConversionFunnel() { return this.request('/reports/funnel'); }
  async getRevenueForecast() { return this.request('/reports/forecast'); }
  async getPerformanceMetrics(days?: number) { return this.request(`/reports/performance${days ? `?days=${days}` : ''}`); }

  // Email
  async sendEmail(data: { to: string; subject: string; body: string; customerId?: string }) {
    return this.request('/emails/send', { method: 'POST', body: JSON.stringify(data) });
  }
  async getEmailHistory() { return this.request('/emails/history'); }
}

export const api = new ApiClient();
export default api;
