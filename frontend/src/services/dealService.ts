import api from './api';
import { Deal, ApiResponse } from '../types';

/**
 * Deal Service
 * خدمات إدارة الصفقات
 */
export const dealService = {
  getAll: async (): Promise<ApiResponse<Deal[]>> => {
    const response = await api.get<ApiResponse<Deal[]>>('/deals');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Deal>> => {
    const response = await api.get<ApiResponse<Deal>>(`/deals/${id}`);
    return response.data;
  },

  create: async (data: Partial<Deal>): Promise<ApiResponse<Deal>> => {
    const response = await api.post<ApiResponse<Deal>>('/deals', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Deal>): Promise<ApiResponse<Deal>> => {
    const response = await api.put<ApiResponse<Deal>>(`/deals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{}>> => {
    const response = await api.delete<ApiResponse<{}>>(`/deals/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/deals/stats');
    return response.data;
  },
};
