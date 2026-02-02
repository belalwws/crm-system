import api from './api';
import { DashboardStats, ApiResponse } from '../types';

/**
 * Dashboard Service
 * خدمات الـ Dashboard
 */
export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  getActivities: async (limit: number = 10) => {
    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data;
  },
};
