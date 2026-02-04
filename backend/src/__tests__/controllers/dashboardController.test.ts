import { Response } from 'express';
import { AuthRequest } from '../../types';

// Mock Prisma
const mockPrisma = {
  customer: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  deal: {
    count: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  task: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import * as dashboardController from '../../controllers/dashboardController';

describe('Dashboard Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@test.com' },
      query: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Mock all Promise.all queries in the correct order
      mockPrisma.customer.count.mockResolvedValue(50);
      mockPrisma.deal.count.mockResolvedValue(25);
      mockPrisma.deal.aggregate.mockResolvedValue({ 
        _sum: { value: 500000 }, 
        _count: { id: 5 } 
      });
      mockPrisma.task.count.mockResolvedValue(30);
      mockPrisma.deal.groupBy.mockResolvedValue([
        { stage: 'LEAD', _count: { id: 10 }, _sum: { value: 100000 } },
        { stage: 'PROPOSAL', _count: { id: 8 }, _sum: { value: 200000 } },
        { stage: 'CLOSED_WON', _count: { id: 7 }, _sum: { value: 200000 } },
      ]);
      mockPrisma.task.findMany.mockResolvedValue([
        { id: '1', title: 'Task 1', dueDate: new Date(), type: 'CALL', priority: 'HIGH', status: 'PENDING', customer: null, deal: null },
      ]);
      mockPrisma.deal.findMany.mockResolvedValue([
        { id: '1', title: 'Deal 1', value: 10000, stage: 'LEAD', customer: { id: 'c1', name: 'Customer 1' }, owner: {} },
      ]);

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
    });

    it('should return correct customer count', async () => {
      mockPrisma.customer.count.mockResolvedValue(100);
      mockPrisma.deal.count.mockResolvedValue(0);
      mockPrisma.deal.aggregate.mockResolvedValue({ _sum: { value: 0 } });
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.deal.groupBy.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.count).toHaveBeenCalledWith({
        where: { ownerId: 'test-user-id' },
      });
    });

    it('should return deals by stage', async () => {
      const stageData = [
        { stage: 'LEAD', _count: { _all: 5 } },
        { stage: 'QUALIFIED', _count: { _all: 3 } },
      ];
      
      mockPrisma.customer.count.mockResolvedValue(10);
      mockPrisma.deal.count.mockResolvedValue(11);
      mockPrisma.deal.aggregate.mockResolvedValue({ _sum: { value: 100000 } });
      mockPrisma.task.count.mockResolvedValue(5);
      mockPrisma.deal.groupBy.mockResolvedValue(stageData);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.deal.findMany.mockResolvedValue([]);

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['stage'],
          where: { ownerId: 'test-user-id' },
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors', async () => {
      mockPrisma.customer.count.mockRejectedValue(new Error('Database error'));

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });
});
