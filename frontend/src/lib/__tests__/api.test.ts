import api from '../api';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('setToken', () => {
    it('should set the token for future requests', () => {
      api.setToken('test-token');
      // Token is stored internally, we'll verify it's used in requests
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard stats', async () => {
      const mockResponse = {
        success: true,
        data: {
          summary: { totalCustomers: 10 },
          dealsByStage: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.getDashboardStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/stats'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCustomers', () => {
    it('should fetch customers without params', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', name: 'Test Customer' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.getCustomers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch customers with search params', async () => {
      const mockResponse = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      await api.getCustomers({ search: 'test', status: 'active' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'New Customer' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const customerData = { name: 'New Customer', email: 'test@example.com' };
      const result = await api.createCustomer(customerData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(customerData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Updated Customer' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.updateCustomer('1', { name: 'Updated Customer' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      const mockResponse = { success: true };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.deleteCustomer('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDeals', () => {
    it('should fetch deals', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', title: 'Test Deal' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.getDeals();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deals'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', title: 'Test Task' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      api.setToken('test-token');
      const result = await api.getTasks();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      });

      api.setToken('test-token');

      await expect(api.getCustomers()).rejects.toThrow('Not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      api.setToken('test-token');

      await expect(api.getCustomers()).rejects.toThrow('Network error');
    });
  });
});
