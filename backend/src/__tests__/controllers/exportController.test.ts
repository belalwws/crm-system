import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  deal: {
    findMany: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

import * as exportController from '../../controllers/exportController';

describe('Export Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let writtenData: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    writtenData = [];
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@test.com' },
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      write: jest.fn((data: string) => { writtenData.push(data); return true; }),
      end: jest.fn(),
      send: jest.fn(),
      headersSent: false,
    };
  });

  describe('exportCustomers', () => {
    it('should export customers as CSV with streaming', async () => {
      const mockCustomers = [
        {
          id: '1',
          name: 'Customer 1',
          email: 'c1@test.com',
          phone: '123456',
          company: 'Company A',
          status: 'ACTIVE',
          source: 'WEBSITE',
          industry: 'Tech',
          website: 'https://example.com',
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.customer.findMany
        .mockResolvedValueOnce(mockCustomers)
        .mockResolvedValueOnce([]);

      await exportController.exportCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=customers.csv'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv'
      );

      // Verify CSV content
      const csvContent = writtenData.join('');
      expect(csvContent).toContain('Name,Email,Phone,Company');
      expect(csvContent).toContain('Customer 1');
      expect(csvContent).toContain('c1@test.com');
    });

    it('should handle empty customer list', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await exportController.exportCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.end).toHaveBeenCalled();
      // Should only have headers
      expect(writtenData[0]).toContain('Name,Email');
    });
  });

  describe('exportDeals', () => {
    it('should export deals as CSV', async () => {
      const mockDeals = [
        {
          id: '1',
          title: 'Deal 1',
          value: 1000,
          stage: 'LEAD',
          probability: 25,
          expectedCloseDate: new Date('2024-06-01'),
          createdAt: new Date('2024-01-01'),
          customer: { name: 'Customer 1' },
        },
      ];

      mockPrisma.deal.findMany
        .mockResolvedValueOnce(mockDeals)
        .mockResolvedValueOnce([]);

      await exportController.exportDeals(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=deals.csv'
      );

      const csvContent = writtenData.join('');
      expect(csvContent).toContain('Title,Customer,Value');
      expect(csvContent).toContain('Deal 1');
      expect(csvContent).toContain('Customer 1');
    });
  });

  describe('exportTasks', () => {
    it('should export tasks as CSV', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Task 1',
          type: 'CALL',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date('2024-02-01'),
          createdAt: new Date('2024-01-01'),
          customer: { name: 'Customer 1' },
          deal: { title: 'Deal 1' },
        },
      ];

      mockPrisma.task.findMany
        .mockResolvedValueOnce(mockTasks)
        .mockResolvedValueOnce([]);

      await exportController.exportTasks(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=tasks.csv'
      );

      const csvContent = writtenData.join('');
      expect(csvContent).toContain('Title,Type,Priority');
      expect(csvContent).toContain('Task 1');
    });
  });

  describe('importCustomers', () => {
    it('should import customers from array data', async () => {
      mockRequest.body = {
        data: [
          { name: 'New Customer', email: 'new@test.com' },
          { name: 'Another Customer', email: 'another@test.com' },
        ],
      };

      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({ id: '1' });

      await exportController.importCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.create).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            created: 2,
          }),
        })
      );
    });

    it('should skip duplicate customers', async () => {
      mockRequest.body = {
        data: [{ name: 'Existing', email: 'existing@test.com' }],
      };

      mockPrisma.customer.findFirst.mockResolvedValue({ id: '1' });

      await exportController.importCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.create).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            skipped: 1,
            created: 0,
          }),
        })
      );
    });

    it('should return error for empty data', async () => {
      mockRequest.body = { data: [] };

      await exportController.importCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
