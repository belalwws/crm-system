import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  activity: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

import * as activityController from '../../controllers/activityController';

describe('Activity Controller', () => {
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

  describe('getActivities', () => {
    it('should return activities for the user', async () => {
      const mockActivities = [
        { id: '1', type: 'CUSTOMER_CREATED', title: 'Customer created', owner: {} },
        { id: '2', type: 'DEAL_CREATED', title: 'Deal created', owner: {} },
      ];

      mockPrisma.activity.findMany.mockResolvedValue(mockActivities);
      mockPrisma.activity.count.mockResolvedValue(2);

      await activityController.getActivities(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.activity.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('getEntityActivities', () => {
    it('should return activities for a specific entity', async () => {
      mockRequest.params = { entityType: 'customer', entityId: 'cust-1' };
      const mockActivities = [
        { id: '1', type: 'CUSTOMER_UPDATED', entityType: 'customer', entityId: 'cust-1' },
      ];

      mockPrisma.activity.findMany.mockResolvedValue(mockActivities);

      await activityController.getEntityActivities(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.activity.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logActivity (helper)', () => {
    it('should create an activity log entry', async () => {
      mockPrisma.activity.create.mockResolvedValue({
        id: 'activity-1',
        ownerId: 'user-1',
        type: 'CUSTOMER_CREATED',
        entityType: 'customer',
        entityId: 'cust-1',
        title: 'Created customer',
      });

      await activityController.logActivity(
        'user-1',
        'CUSTOMER_CREATED' as any,
        'customer',
        'cust-1',
        'Created customer'
      );

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user-1',
            entityType: 'customer',
            entityId: 'cust-1',
            title: 'Created customer',
          }),
        })
      );
    });
  });

  describe('logCustomerCreated (helper)', () => {
    it('should log customer creation activity', async () => {
      mockPrisma.activity.create.mockResolvedValue({ id: 'act-1' });

      await activityController.logCustomerCreated('user-1', 'cust-1', 'Acme Corp');

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user-1',
            entityId: 'cust-1',
          }),
        })
      );
    });
  });

  describe('logDealStageChanged (helper)', () => {
    it('should log deal stage change', async () => {
      mockPrisma.activity.create.mockResolvedValue({ id: 'act-1' });

      await activityController.logDealStageChanged('user-1', 'deal-1', 'Big Deal', 'lead', 'qualified');

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user-1',
            entityId: 'deal-1',
          }),
        })
      );
    });
  });

  describe('logTaskCompleted (helper)', () => {
    it('should log task completion', async () => {
      mockPrisma.activity.create.mockResolvedValue({ id: 'act-1' });

      await activityController.logTaskCompleted('user-1', 'task-1', 'Follow up call');

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user-1',
            entityId: 'task-1',
          }),
        })
      );
    });
  });
});
