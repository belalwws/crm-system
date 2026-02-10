import { Response } from 'express';
import { AuthRequest } from '../../types';

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
  activity: {
    findMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
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

  /**
   * Helper to set up all the mocks needed for getDashboardStats.
   * The controller does a Promise.all with 15 queries + 1 after.
   */
  function setupDashboardMocks(overrides: {
    customerCount?: number;
    dealCount?: number;
    taskCount?: number;
    dealAggregate?: any;
    dealGroupBy?: any[];
    taskFindMany?: any[];
    dealFindMany?: any[];
  } = {}) {
    const {
      customerCount = 10,
      dealCount = 5,
      taskCount = 3,
      dealAggregate = { _sum: { value: 100000 }, _count: { id: 5 } },
      dealGroupBy = [],
      taskFindMany = [],
      dealFindMany = [],
    } = overrides;

    mockPrisma.customer.count.mockResolvedValue(customerCount);
    mockPrisma.deal.count.mockResolvedValue(dealCount);
    mockPrisma.task.count.mockResolvedValue(taskCount);
    mockPrisma.deal.aggregate.mockResolvedValue(dealAggregate);
    mockPrisma.deal.groupBy.mockResolvedValue(dealGroupBy);
    mockPrisma.task.findMany.mockResolvedValue(taskFindMany);
    mockPrisma.deal.findMany.mockResolvedValue(dealFindMany);
  }

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      setupDashboardMocks({
        customerCount: 50,
        dealCount: 25,
        taskCount: 30,
        dealAggregate: { _sum: { value: 500000 }, _count: { id: 5 } },
        dealGroupBy: [
          { stage: 'LEAD', _count: { id: 10 }, _sum: { value: 100000 } },
          { stage: 'PROPOSAL', _count: { id: 8 }, _sum: { value: 200000 } },
          { stage: 'CLOSED_WON', _count: { id: 7 }, _sum: { value: 200000 } },
        ],
        taskFindMany: [
          { id: '1', title: 'Task 1', dueDate: new Date(), type: 'CALL', priority: 'HIGH', status: 'PENDING', customer: null, deal: null },
        ],
        dealFindMany: [
          { id: '1', value: 10000, stage: 'LEAD', createdAt: new Date() },
        ],
      });

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
    });

    it('should return correct customer count', async () => {
      setupDashboardMocks({ customerCount: 100 });

      await dashboardController.getDashboardStats(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'test-user-id', deletedAt: null }),
        })
      );
    });

    it('should return deals by stage', async () => {
      setupDashboardMocks({
        dealGroupBy: [
          { stage: 'LEAD', _count: { id: 5 }, _sum: { value: 50000 } },
          { stage: 'QUALIFIED', _count: { id: 3 }, _sum: { value: 30000 } },
        ],
      });

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
