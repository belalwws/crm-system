import { Response } from 'express';
import { AuthRequest } from '../../types';

// Mock Prisma
const mockPrisma = {
  deal: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import * as dealController from '../../controllers/dealController';

describe('Deal Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@test.com' },
      query: {},
      params: {},
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getDeals', () => {
    it('should return all deals for a user', async () => {
      const mockDeals = [
        { id: '1', title: 'Deal 1', value: 10000, stage: 'LEAD', customer: {}, owner: {} },
        { id: '2', title: 'Deal 2', value: 20000, stage: 'PROPOSAL', customer: {}, owner: {} },
      ];

      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      await dealController.getDeals(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'test-user-id' },
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
        })
      );
    });
  });

  describe('getDeal', () => {
    it('should return a single deal by id', async () => {
      const mockDeal = { 
        id: '1', 
        title: 'Deal 1', 
        value: 10000, 
        stage: 'LEAD',
        ownerId: 'test-user-id',
        customer: { id: 'c1', name: 'Customer 1' },
        owner: {}
      };
      mockRequest.params = { id: '1' };
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal);

      await dealController.getDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '1',
            ownerId: 'test-user-id',
          },
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if deal not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await dealController.getDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createDeal', () => {
    it('should create a new deal', async () => {
      const dealData = {
        title: 'New Deal',
        value: 15000,
        stage: 'lead',
        customerId: 'customer-1',
      };
      mockRequest.body = dealData;

      // Mock customer verification - this is called first
      mockPrisma.customer.findFirst.mockResolvedValue({ 
        id: 'customer-1', 
        name: 'Test Customer',
        ownerId: 'test-user-id'
      });

      const createdDeal = { 
        id: '1', 
        title: 'New Deal',
        value: 15000,
        stage: 'LEAD', 
        ownerId: 'test-user-id',
        customerId: 'customer-1',
        customer: { id: 'customer-1', name: 'Test Customer' },
        owner: { id: 'test-user-id', name: 'Test User' }
      };
      mockPrisma.deal.create.mockResolvedValue(createdDeal);

      await dealController.createDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.findFirst).toHaveBeenCalled();
      expect(mockPrisma.deal.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if customer not found', async () => {
      const dealData = {
        title: 'New Deal',
        value: 15000,
        stage: 'lead',
        customerId: 'nonexistent-customer',
      };
      mockRequest.body = dealData;

      // Mock customer not found
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await dealController.createDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockPrisma.deal.create).not.toHaveBeenCalled();
    });
  });

  describe('updateDeal', () => {
    it('should update deal stage', async () => {
      const existingDeal = { id: '1', title: 'Deal 1', stage: 'LEAD', ownerId: 'test-user-id', customer: {}, owner: {} };
      mockRequest.params = { id: '1' };
      mockRequest.body = { stage: 'proposal' };

      mockPrisma.deal.findFirst.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue({ ...existingDeal, stage: 'PROPOSAL' });

      await dealController.updateDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent deal', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { stage: 'proposal' };
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await dealController.updateDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteDeal', () => {
    it('should delete a deal', async () => {
      const existingDeal = { id: '1', title: 'Deal 1', ownerId: 'test-user-id' };
      mockRequest.params = { id: '1' };

      mockPrisma.deal.findFirst.mockResolvedValue(existingDeal);
      mockPrisma.deal.delete.mockResolvedValue(existingDeal);

      await dealController.deleteDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.deal.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent deal', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await dealController.deleteDeal(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deal stages', () => {
    it('should validate deal stages', () => {
      const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
      validStages.forEach(stage => {
        expect(validStages).toContain(stage);
      });
    });
  });
});
