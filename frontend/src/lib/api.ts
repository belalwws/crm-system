// API Client for CRM — Fully Typed
import type {
  Customer, CustomerListParams, Deal, DealListParams,
  Task, TaskListParams, UserListParams, UserPreferences,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  totalPages?: number;
  page?: number;
}

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

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildQuery(params: Record<string, any>): string {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== '') query.set(key, String(val));
    }
    const qs = query.toString();
    return qs ? `?${qs}` : '';
  }

  // ==============================
  // Dashboard
  // ==============================
  async getDashboardStats() { return this.request('/dashboard/stats'); }
  async getRecentActivities() { return this.request('/dashboard/activities'); }

  // ==============================
  // Customers
  // ==============================
  async getCustomers(params?: CustomerListParams) {
    return this.request(`/customers${this.buildQuery(params || {})}`);
  }
  async getCustomer(id: string) { return this.request<Customer>(`/customers/${id}`); }
  async createCustomer(data: Partial<Customer>) {
    return this.request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateCustomer(id: string, data: Partial<Customer>) {
    return this.request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteCustomer(id: string) { return this.request(`/customers/${id}`, { method: 'DELETE' }); }
  async restoreCustomer(id: string) { return this.request(`/customers/${id}/restore`, { method: 'POST' }); }
  async checkDuplicates(data: { email?: string; phone?: string; name?: string }) {
    return this.request('/customers/check-duplicates', { method: 'POST', body: JSON.stringify(data) });
  }
  async mergeCustomers(primaryId: string, secondaryId: string) {
    return this.request('/customers/merge', { method: 'POST', body: JSON.stringify({ primaryId, secondaryId }) });
  }

  // ==============================
  // Deals
  // ==============================
  async getDeals(params?: DealListParams) {
    return this.request(`/deals${this.buildQuery(params || {})}`);
  }
  async getDeal(id: string) { return this.request<Deal>(`/deals/${id}`); }
  async createDeal(data: Partial<Deal>) {
    return this.request<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateDeal(id: string, data: Partial<Deal>) {
    return this.request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteDeal(id: string) { return this.request(`/deals/${id}`, { method: 'DELETE' }); }
  async restoreDeal(id: string) { return this.request(`/deals/${id}/restore`, { method: 'POST' }); }
  async getDealStats() { return this.request('/deals/stats'); }

  // ==============================
  // Tasks
  // ==============================
  async getTasks(params?: TaskListParams) {
    return this.request(`/tasks${this.buildQuery(params || {})}`);
  }
  async getTask(id: string) { return this.request<Task>(`/tasks/${id}`); }
  async createTask(data: Partial<Task>) {
    return this.request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateTask(id: string, data: Partial<Task>) {
    return this.request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteTask(id: string) { return this.request(`/tasks/${id}`, { method: 'DELETE' }); }
  async restoreTask(id: string) { return this.request(`/tasks/${id}/restore`, { method: 'POST' }); }

  // ==============================
  // Notes
  // ==============================
  async getNotes(params?: { customerId?: string; dealId?: string }) {
    return this.request(`/notes${this.buildQuery(params || {})}`);
  }
  async createNote(data: { content: string; customerId?: string; dealId?: string }) {
    return this.request('/notes', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteNote(id: string) { return this.request(`/notes/${id}`, { method: 'DELETE' }); }

  // ==============================
  // Notifications
  // ==============================
  async getNotifications() { return this.request('/notifications'); }
  async markNotificationRead(id: string) { return this.request(`/notifications/${id}/read`, { method: 'POST' }); }
  async markAllNotificationsRead() { return this.request('/notifications/mark-all-read', { method: 'POST' }); }
  async deleteNotification(id: string) { return this.request(`/notifications/${id}`, { method: 'DELETE' }); }
  async deleteAllNotifications() { return this.request('/notifications', { method: 'DELETE' }); }

  // ==============================
  // Activities
  // ==============================
  async getActivities() { return this.request('/activities'); }
  async getEntityActivities(entityType: string, entityId: string) {
    return this.request(`/activities/${entityType}/${entityId}`);
  }

  // ==============================
  // AI Features
  // ==============================
  async aiChat(message: string, context?: string, conversationHistory?: Array<{ role: string; content: string }>) {
    return this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context, conversationHistory }) });
  }
  async aiComposeEmail(data: { customerId?: string; purpose: string; tone?: string; additionalContext?: string }) {
    return this.request('/ai/compose-email', { method: 'POST', body: JSON.stringify(data) });
  }
  async aiCustomerInsights(customerId: string) { return this.request(`/ai/customer-insights/${customerId}`); }
  async aiDealAnalysis(dealId: string) { return this.request(`/ai/deal-analysis/${dealId}`); }
  async aiPrioritizeTasks() { return this.request('/ai/prioritize-tasks'); }
  async aiSummarize(type: string, entityId: string) {
    return this.request('/ai/summarize', { method: 'POST', body: JSON.stringify({ type, entityId }) });
  }
  async aiDashboardInsights() { return this.request('/ai/dashboard-insights'); }

  // ==============================
  // Timeline
  // ==============================
  async getCustomerTimeline(customerId: string, params?: { page?: number; limit?: number; type?: string }) {
    return this.request(`/timeline/customer/${customerId}${this.buildQuery(params || {})}`);
  }
  async getDealTimeline(dealId: string, params?: { page?: number; limit?: number; type?: string }) {
    return this.request(`/timeline/deal/${dealId}${this.buildQuery(params || {})}`);
  }
  async createTimelineEntry(data: { type: string; title: string; description?: string; customerId?: string; dealId?: string }) {
    return this.request('/timeline', { method: 'POST', body: JSON.stringify(data) });
  }

  // ==============================
  // Global Search
  // ==============================
  async globalSearch(q: string, entity?: string) {
    return this.request(`/search${this.buildQuery({ q, entity })}`);
  }

  // ==============================
  // Saved Views
  // ==============================
  async getSavedViews(entity?: string) { return this.request(`/search/saved-views${entity ? `?entity=${entity}` : ''}`); }
  async createSavedView(data: Record<string, unknown>) {
    return this.request('/search/saved-views', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateSavedView(id: string, data: Record<string, unknown>) {
    return this.request(`/search/saved-views/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteSavedView(id: string) { return this.request(`/search/saved-views/${id}`, { method: 'DELETE' }); }

  // ==============================
  // Reports
  // ==============================
  async getConversionFunnel() { return this.request('/reports/funnel'); }
  async getDealAging() { return this.request('/reports/aging'); }
  async getRevenueForecast() { return this.request('/reports/forecast'); }
  async getPerformanceMetrics(days?: number) { return this.request(`/reports/performance${days ? `?days=${days}` : ''}`); }
  async getActivityHeatmap(days?: number) { return this.request(`/reports/activity-heatmap${days ? `?days=${days}` : ''}`); }

  // ==============================
  // Workflows
  // ==============================
  async getWorkflowRules() { return this.request('/workflows'); }
  async createWorkflowRule(data: Record<string, unknown>) {
    return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateWorkflowRule(id: string, data: Record<string, unknown>) {
    return this.request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteWorkflowRule(id: string) { return this.request(`/workflows/${id}`, { method: 'DELETE' }); }
  async toggleWorkflowRule(id: string) { return this.request(`/workflows/${id}/toggle`, { method: 'PATCH' }); }
  async getWorkflowLogs(id: string) { return this.request(`/workflows/${id}/logs`); }

  // ==============================
  // Audit Logs
  // ==============================
  async getAuditLogs(params?: { entityType?: string; action?: string; page?: number; limit?: number }) {
    return this.request(`/audit-logs${this.buildQuery(params || {})}`);
  }
  async getEntityAuditTrail(entityType: string, entityId: string) {
    return this.request(`/audit-logs/${entityType}/${entityId}`);
  }

  // ==============================
  // Webhooks
  // ==============================
  async getWebhooks() { return this.request('/webhooks'); }
  async createWebhook(data: Record<string, unknown>) {
    return this.request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateWebhook(id: string, data: Record<string, unknown>) {
    return this.request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteWebhook(id: string) { return this.request(`/webhooks/${id}`, { method: 'DELETE' }); }
  async getWebhookLogs(id: string) { return this.request(`/webhooks/${id}/logs`); }
  async testWebhook(id: string) { return this.request(`/webhooks/${id}/test`, { method: 'POST' }); }

  // ==============================
  // Admin
  // ==============================
  async getUsers(params?: UserListParams) {
    return this.request(`/admin/users${this.buildQuery(params || {})}`);
  }
  async getUser(id: string) { return this.request(`/admin/users/${id}`); }
  async updateUserRole(id: string, role: string) {
    return this.request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }
  async toggleUserStatus(id: string, isActive: boolean) {
    return this.request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  }
  async updateUserByAdmin(id: string, data: Record<string, unknown>) {
    return this.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteUserByAdmin(id: string) { return this.request(`/admin/users/${id}`, { method: 'DELETE' }); }
  async getPlatformStats() { return this.request('/admin/stats'); }
  async inviteUser(data: { email: string; name: string; role: string }) {
    return this.request('/admin/invite', { method: 'POST', body: JSON.stringify(data) });
  }
  async getSystemSettings() { return this.request('/admin/settings'); }
  async updateSystemSettings(data: Record<string, unknown>) {
    return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  // ==============================
  // Profile
  // ==============================
  async getProfile() { return this.request('/profile'); }
  async updateProfile(data: { name?: string; phone?: string; company?: string; timezone?: string }) {
    return this.request('/profile', { method: 'PUT', body: JSON.stringify(data) });
  }
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/profile/change-password', { method: 'POST', body: JSON.stringify(data) });
  }
  async getPreferences() { return this.request<UserPreferences>('/profile/preferences'); }
  async updatePreferences(data: Partial<UserPreferences>) {
    return this.request('/profile/preferences', { method: 'PUT', body: JSON.stringify(data) });
  }

  // ==============================
  // Export / Import
  // ==============================
  async exportCsv(entity: 'customers' | 'deals' | 'tasks'): Promise<Blob> {
    const url = `${API_URL}/export/${entity}`;
    const headers: HeadersInit = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(url, { headers });
    return res.blob();
  }
  async importCustomers(data: Record<string, unknown>[]) {
    return this.request('/import/customers', { method: 'POST', body: JSON.stringify({ data }) });
  }

  // ==============================
  // Contacts
  // ==============================
  async getContacts(customerId?: string) {
    return this.request(`/contacts${customerId ? `?customerId=${customerId}` : ''}`);
  }
  async createContact(data: { firstName: string; lastName: string; email?: string; phone?: string; customerId: string }) {
    return this.request('/contacts', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateContact(id: string, data: Record<string, unknown>) {
    return this.request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteContact(id: string) { return this.request(`/contacts/${id}`, { method: 'DELETE' }); }

  // ==============================
  // Products
  // ==============================
  async getProducts(params?: string) { return this.request(`/products${params ? `?${params}` : ''}`); }
  async createProduct(data: { name: string; price: number; description?: string; sku?: string; category?: string }) {
    return this.request('/products', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteProduct(id: string) { return this.request(`/products/${id}`, { method: 'DELETE' }); }

  // ==============================
  // Quotes
  // ==============================
  async getQuotes(params?: string) { return this.request(`/quotes${params ? `?${params}` : ''}`); }
  async getQuote(id: string) { return this.request(`/quotes/${id}`); }
  async createQuote(data: Record<string, unknown>) {
    return this.request('/quotes', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateQuote(id: string, data: Record<string, unknown>) {
    return this.request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteQuote(id: string) { return this.request(`/quotes/${id}`, { method: 'DELETE' }); }
  async sendQuote(id: string) { return this.request(`/quotes/${id}/send`, { method: 'POST' }); }

  // ==============================
  // Teams
  // ==============================
  async getTeams() { return this.request('/teams'); }
  async createTeam(data: { name: string; description?: string }) {
    return this.request('/teams', { method: 'POST', body: JSON.stringify(data) });
  }
  async addTeamMember(teamId: string, data: { userId: string; role?: string }) {
    return this.request(`/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify(data) });
  }
  async removeTeamMember(teamId: string, userId: string) {
    return this.request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
  }
  async deleteTeam(id: string) { return this.request(`/teams/${id}`, { method: 'DELETE' }); }

  // ==============================
  // Custom Fields
  // ==============================
  async getCustomFields(entity?: string) {
    return this.request(`/custom-fields${entity ? `?entity=${entity}` : ''}`);
  }
  async createCustomField(data: Record<string, unknown>) {
    return this.request('/custom-fields', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateCustomField(id: string, data: Record<string, unknown>) {
    return this.request(`/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteCustomField(id: string) { return this.request(`/custom-fields/${id}`, { method: 'DELETE' }); }
  async getCustomFieldValues(entityId: string) { return this.request(`/custom-fields/values/${entityId}`); }
  async setCustomFieldValues(entityId: string, values: Array<{ fieldId: string; value: string }>) {
    return this.request(`/custom-fields/values/${entityId}`, { method: 'PUT', body: JSON.stringify({ values }) });
  }

  // ==============================
  // Metrics & Emails & Documents & Meetings
  // ==============================
  async getMetrics() { return this.request('/metrics'); }
  async sendEmail(data: { to: string; subject: string; body: string; customerId?: string }) {
    return this.request('/emails/send', { method: 'POST', body: JSON.stringify(data) });
  }
  async getEmailHistory() { return this.request('/emails/history'); }
  async getEmailTemplates() { return this.request('/emails/templates'); }
  async createEmailTemplate(data: Record<string, unknown>) {
    return this.request('/emails/templates', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateEmailTemplate(id: string, data: Record<string, unknown>) {
    return this.request(`/emails/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteEmailTemplate(id: string) { return this.request(`/emails/templates/${id}`, { method: 'DELETE' }); }
  async getDocuments() { return this.request('/documents'); }
  async getDocument(id: string) { return this.request(`/documents/${id}`); }
  async deleteDocument(id: string) { return this.request(`/documents/${id}`, { method: 'DELETE' }); }
  async getMeetings() { return this.request('/meetings'); }
  async getMeeting(id: string) { return this.request(`/meetings/${id}`); }
  async createMeeting(data: Record<string, unknown>) {
    return this.request('/meetings', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateMeeting(id: string, data: Record<string, unknown>) {
    return this.request(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteMeeting(id: string) { return this.request(`/meetings/${id}`, { method: 'DELETE' }); }
  async getCalendarEvents() { return this.request('/meetings/calendar'); }
  async getUpcomingMeetings() { return this.request('/meetings/upcoming'); }

  // ==============================
  // Bulk Operations
  // ==============================
  async bulkDeleteCustomers(ids: string[]) {
    return this.request('/bulk/customers/delete', { method: 'POST', body: JSON.stringify({ ids }) });
  }
  async bulkDeleteDeals(ids: string[]) {
    return this.request('/bulk/deals/delete', { method: 'POST', body: JSON.stringify({ ids }) });
  }
  async bulkDeleteTasks(ids: string[]) {
    return this.request('/bulk/tasks/delete', { method: 'POST', body: JSON.stringify({ ids }) });
  }
  async bulkUpdateDealStage(ids: string[], stage: string) {
    return this.request('/bulk/deals/stage', { method: 'POST', body: JSON.stringify({ ids, stage }) });
  }
  async bulkUpdateTaskStatus(ids: string[], status: string) {
    return this.request('/bulk/tasks/status', { method: 'POST', body: JSON.stringify({ ids, status }) });
  }
  async bulkAssignTasks(ids: string[], assignedToId: string) {
    return this.request('/bulk/tasks/assign', { method: 'POST', body: JSON.stringify({ ids, assignedToId }) });
  }

  // ==============================
  // Auth (non-Clerk flows)
  // ==============================
  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  }
  async resetPassword(data: { token: string; email: string; password: string }) {
    return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
  }
  async sendVerification() { return this.request('/auth/send-verification', { method: 'POST' }); }
  async verifyEmail(data: { token: string; email: string }) {
    return this.request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) });
  }

  // ==============================
  // Analytics (legacy compat)
  // ==============================
  async getAnalytics(period?: string) { return this.request(`/analytics${period ? `?period=${period}` : ''}`); }
  async getReports() { return this.request('/reports'); }
}

export const api = new ApiClient();
export default api;
