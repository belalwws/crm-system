// API Client for CRM
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
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
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getRecentActivities() {
    return this.request('/dashboard/activities');
  }

  // Customers
  async getCustomers(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreCustomer(id: string) {
    return this.request(`/customers/${id}/restore`, { method: 'POST' });
  }

  async checkDuplicates(data: { email?: string; phone?: string; name?: string }) {
    return this.request('/customers/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async mergeCustomers(primaryId: string, secondaryId: string) {
    return this.request('/customers/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryId, secondaryId }),
    });
  }

  // Deals
  async getDeals(params?: { search?: string; stage?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.stage) query.set('stage', params.stage);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request(`/deals${queryString ? `?${queryString}` : ''}`);
  }

  async getDeal(id: string) {
    return this.request(`/deals/${id}`);
  }

  async createDeal(data: any) {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeal(id: string, data: any) {
    return this.request(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeal(id: string) {
    return this.request(`/deals/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreDeal(id: string) {
    return this.request(`/deals/${id}/restore`, { method: 'POST' });
  }

  // Tasks
  async getTasks(params?: { search?: string; status?: string; priority?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request(`/tasks${queryString ? `?${queryString}` : ''}`);
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreTask(id: string) {
    return this.request(`/tasks/${id}/restore`, { method: 'POST' });
  }

  // Notes (new feature)
  async getNotes(params?: { customerId?: string; dealId?: string }) {
    const query = new URLSearchParams();
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.dealId) query.set('dealId', params.dealId);
    const queryString = query.toString();
    return this.request(`/notes${queryString ? `?${queryString}` : ''}`);
  }

  async createNote(data: any) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics (new feature)
  async getAnalytics(period?: string) {
    return this.request(`/analytics${period ? `?period=${period}` : ''}`);
  }

  // Reports (new feature)
  async getReports() {
    return this.request('/reports');
  }

  // =============================================
  // AI Features - مميزات الذكاء الاصطناعي
  // =============================================

  async aiChat(message: string, context?: string, conversationHistory?: Array<{ role: string; content: string }>) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, conversationHistory }),
    });
  }

  async aiComposeEmail(data: { customerId?: string; purpose: string; tone?: string; additionalContext?: string }) {
    return this.request('/ai/compose-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiCustomerInsights(customerId: string) {
    return this.request(`/ai/customer-insights/${customerId}`);
  }

  async aiDealAnalysis(dealId: string) {
    return this.request(`/ai/deal-analysis/${dealId}`);
  }

  async aiPrioritizeTasks() {
    return this.request('/ai/prioritize-tasks');
  }

  async aiSummarize(type: string, entityId: string) {
    return this.request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ type, entityId }),
    });
  }

  async aiDashboardInsights() {
    return this.request('/ai/dashboard-insights');
  }

  // =============================================
  // Timeline - الأحداث الزمنية
  // =============================================

  async getCustomerTimeline(customerId: string, params?: { page?: number; limit?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return this.request(`/timeline/customer/${customerId}${qs ? `?${qs}` : ''}`);
  }

  async getDealTimeline(dealId: string, params?: { page?: number; limit?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return this.request(`/timeline/deal/${dealId}${qs ? `?${qs}` : ''}`);
  }

  async createTimelineEntry(data: { type: string; title: string; description?: string; customerId?: string; dealId?: string; metadata?: any }) {
    return this.request('/timeline', { method: 'POST', body: JSON.stringify(data) });
  }

  // =============================================
  // Global Search - البحث الشامل
  // =============================================

  async globalSearch(q: string, entity?: string) {
    const query = new URLSearchParams({ q });
    if (entity) query.set('entity', entity);
    return this.request(`/search?${query.toString()}`);
  }

  // =============================================
  // Saved Views - العروض المحفوظة
  // =============================================

  async getSavedViews(entity?: string) {
    return this.request(`/search/saved-views${entity ? `?entity=${entity}` : ''}`);
  }

  async createSavedView(data: any) {
    return this.request('/search/saved-views', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSavedView(id: string, data: any) {
    return this.request(`/search/saved-views/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteSavedView(id: string) {
    return this.request(`/search/saved-views/${id}`, { method: 'DELETE' });
  }

  // =============================================
  // Reports - التقارير
  // =============================================

  async getConversionFunnel() {
    return this.request('/reports/funnel');
  }

  async getDealAging() {
    return this.request('/reports/aging');
  }

  async getRevenueForecast() {
    return this.request('/reports/forecast');
  }

  async getPerformanceMetrics(days?: number) {
    return this.request(`/reports/performance${days ? `?days=${days}` : ''}`);
  }

  async getActivityHeatmap(days?: number) {
    return this.request(`/reports/activity-heatmap${days ? `?days=${days}` : ''}`);
  }

  // =============================================
  // Workflows - الأتمتة
  // =============================================

  async getWorkflowRules() {
    return this.request('/workflows');
  }

  async createWorkflowRule(data: any) {
    return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateWorkflowRule(id: string, data: any) {
    return this.request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteWorkflowRule(id: string) {
    return this.request(`/workflows/${id}`, { method: 'DELETE' });
  }

  async toggleWorkflowRule(id: string) {
    return this.request(`/workflows/${id}/toggle`, { method: 'PATCH' });
  }

  async getWorkflowLogs(id: string) {
    return this.request(`/workflows/${id}/logs`);
  }

  // =============================================
  // Audit Logs - سجل التدقيق
  // =============================================

  async getAuditLogs(params?: { entityType?: string; action?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.action) query.set('action', params.action);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return this.request(`/audit-logs${qs ? `?${qs}` : ''}`);
  }

  async getEntityAuditTrail(entityType: string, entityId: string) {
    return this.request(`/audit-logs/${entityType}/${entityId}`);
  }

  // =============================================
  // Webhooks - الويب هوك
  // =============================================

  async getWebhooks() {
    return this.request('/webhooks');
  }

  async createWebhook(data: any) {
    return this.request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateWebhook(id: string, data: any) {
    return this.request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' });
  }

  async getWebhookLogs(id: string) {
    return this.request(`/webhooks/${id}/logs`);
  }

  async testWebhook(id: string) {
    return this.request(`/webhooks/${id}/test`, { method: 'POST' });
  }

  // Deal Stats
  async getDealStats() {
    return this.request('/deals/stats');
  }
}

export const api = new ApiClient();
export default api;
