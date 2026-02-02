import api from './api';
import { Task, ApiResponse } from '../types';

/**
 * Task Service
 * خدمات إدارة المهام
 */
export const taskService = {
  getAll: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get<ApiResponse<Task[]>>('/tasks');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{}>> => {
    const response = await api.delete<ApiResponse<{}>>(`/tasks/${id}`);
    return response.data;
  },
};
