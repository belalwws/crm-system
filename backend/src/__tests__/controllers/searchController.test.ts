import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  deal: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  note: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  savedView: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

import * as searchController from '../../controllers/searchController';

describe('Search Controller', () => {
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

  describe('globalSearch', () => {
    it('should search across all entities', async () => {
      mockRequest.query = { q: 'acme' };

      mockPrisma.customer.findMany.mockResolvedValue([
        { id: '1', name: 'Acme Corp', email: 'info@acme.com' },
      ]);
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.contact.findMany.mockResolvedValue([]);
      mockPrisma.note.findMany.mockResolvedValue([]);

      await searchController.globalSearch(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 400 if query is empty', async () => {
      mockRequest.query = { q: '' };

      await searchController.globalSearch(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSavedViews', () => {
    it('should return saved views for user', async () => {
      const mockViews = [
        { id: '1', name: 'My Customers', entity: 'customer', filters: {} },
      ];
      mockPrisma.savedView.findMany.mockResolvedValue(mockViews);

      await searchController.getSavedViews(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.savedView.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createSavedView', () => {
    it('should create a saved view', async () => {
      mockRequest.body = {
        name: 'Active Deals',
        entity: 'deal',
        filters: { stage: 'qualified' },
      };
      const mockView = { id: 'view-1', ...mockRequest.body, userId: 'test-user-id' };
      mockPrisma.savedView.create.mockResolvedValue(mockView);

      await searchController.createSavedView(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.savedView.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('deleteSavedView', () => {
    it('should delete a saved view', async () => {
      mockRequest.params = { id: 'view-1' };
      const existing = { id: 'view-1', userId: 'test-user-id' };
      mockPrisma.savedView.findFirst.mockResolvedValue(existing);
      mockPrisma.savedView.delete.mockResolvedValue(existing);

      await searchController.deleteSavedView(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.savedView.delete).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
