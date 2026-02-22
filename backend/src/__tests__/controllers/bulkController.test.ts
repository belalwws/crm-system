import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  customer: {
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  deal: {
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  task: {
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
}));

import * as bulkController from '../../controllers/bulkController';

describe('Bulk Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@test.com' },
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('bulkDeleteCustomers', () => {
    it('should soft delete multiple customers', async () => {
      mockRequest.body = { ids: ['c1', 'c2', 'c3'] };
      mockPrisma.customer.updateMany.mockResolvedValue({ count: 3 });

      await bulkController.bulkDeleteCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['c1', 'c2', 'c3'] },
            ownerId: 'test-user-id',
          },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            deletedById: 'test-user-id',
          }),
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return error if no ids provided', async () => {
      mockRequest.body = { ids: [] };

      await bulkController.bulkDeleteCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject array with more than 100 ids', async () => {
      mockRequest.body = { ids: Array(101).fill('id') };

      await bulkController.bulkDeleteCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkUpdateDealStage', () => {
    it('should update stage for multiple deals', async () => {
      mockRequest.body = { ids: ['d1', 'd2'], stage: 'QUALIFIED' };
      mockPrisma.deal.updateMany.mockResolvedValue({ count: 2 });

      await bulkController.bulkUpdateDealStage(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['d1', 'd2'] },
            ownerId: 'test-user-id',
            deletedAt: null,
          },
          data: { stage: 'QUALIFIED' },
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { updated: 2 },
        })
      );
    });

    it('should return error for invalid stage', async () => {
      mockRequest.body = { ids: ['d1'], stage: 'INVALID_STAGE' };

      await bulkController.bulkUpdateDealStage(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkDeleteDeals', () => {
    it('should soft delete multiple deals', async () => {
      mockRequest.body = { ids: ['d1', 'd2'] };
      mockPrisma.deal.updateMany.mockResolvedValue({ count: 2 });

      await bulkController.bulkDeleteDeals(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['d1', 'd2'] },
            ownerId: 'test-user-id',
          },
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('bulkDeleteTasks', () => {
    it('should soft delete multiple tasks', async () => {
      mockRequest.body = { ids: ['t1', 't2'] };
      mockPrisma.task.updateMany.mockResolvedValue({ count: 2 });

      await bulkController.bulkDeleteTasks(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['t1', 't2'] },
            assignedToId: 'test-user-id',
          },
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
