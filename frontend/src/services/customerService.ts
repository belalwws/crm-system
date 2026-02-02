import api from './api';
import { Customer, ApiResponse } from '../types';

/**
 * Customer Service
 * خدمات إدارة العملاء
 */
export const customerService = {
  /**
   * Get all customers
   */
  getAll: async (): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers');
    return response.data;
  },

  /**
   * Get single customer
   */
  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Create new customer
   */
  create: async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  /**
   * Update customer
   */
  update: async (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Delete customer
   */
  delete: async (id: string): Promise<ApiResponse<{}>> => {
    const response = await api.delete<ApiResponse<{}>>(`/customers/${id}`);
    return response.data;
  },
};
