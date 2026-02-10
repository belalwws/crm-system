import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
  createTimelineEvent: jest.fn(),
  computeDiff: jest.fn().mockReturnValue(null),
}));

jest.mock('../../lib/workflowEngine', () => ({
  fireWebhooks: jest.fn(),
  evaluateWorkflows: jest.fn(),
}));

import * as customerController from '../../controllers/customerController';

describe('Customer Controller', () => {
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

  describe('getCustomers', () => {
    it('should return all customers for a user', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1', email: 'c1@test.com', status: 'ACTIVE', owner: {} },
        { id: '2', name: 'Customer 2', email: 'c2@test.com', status: 'LEAD', owner: {} },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrisma.customer.count.mockResolvedValue(2);

      await customerController.getCustomers(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: 'test-user-id',
            deletedAt: null,
          }),
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

  describe('getCustomer', () => {
    it('should return a single customer by id', async () => {
      const mockCustomer = { id: '1', name: 'Customer 1', ownerId: 'test-user-id', status: 'ACTIVE', owner: {} };
      mockRequest.params = { id: '1' };
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      await customerController.getCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '1',
            ownerId: 'test-user-id',
            deletedAt: null,
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if customer not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await customerController.getCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Customer not found',
        })
      );
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer with valid data', async () => {
      const customerData = {
        name: 'New Customer',
        email: 'new@test.com',
        company: 'Test Corp',
        status: 'lead',
      };
      mockRequest.body = customerData;

      // Mock duplicate detection (findMany for duplicates)
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const createdCustomer = {
        id: '1',
        name: 'New Customer',
        email: 'new@test.com',
        company: 'Test Corp',
        status: 'LEAD',
        ownerId: 'test-user-id',
        owner: {},
      };
      mockPrisma.customer.create.mockResolvedValue(createdCustomer);

      await customerController.createCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const existingCustomer = { id: '1', name: 'Old Name', ownerId: 'test-user-id', status: 'ACTIVE', owner: {} };
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name' };

      mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer);
      mockPrisma.customer.update.mockResolvedValue({ ...existingCustomer, name: 'New Name' });

      await customerController.updateCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent customer', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { name: 'New Name' };
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await customerController.updateCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCustomer', () => {
    it('should soft delete a customer', async () => {
      const existingCustomer = { id: '1', name: 'Customer', ownerId: 'test-user-id', status: 'ACTIVE' };
      mockRequest.params = { id: '1' };

      mockPrisma.customer.findFirst.mockResolvedValue(existingCustomer);
      mockPrisma.customer.update.mockResolvedValue({ ...existingCustomer, deletedAt: new Date() });

      await customerController.deleteCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent customer', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await customerController.deleteCustomer(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
