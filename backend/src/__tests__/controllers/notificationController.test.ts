import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../lib/socket', () => ({
  emitToUser: jest.fn(),
}));

import * as notificationController from '../../controllers/notificationController';

describe('Notification Controller', () => {
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

  describe('getNotifications', () => {
    it('should return notifications for the user', async () => {
      const mockNotifications = [
        { id: '1', title: 'New Deal', message: 'Deal created', read: false, userId: 'test-user-id' },
        { id: '2', title: 'Task Due', message: 'Task is due', read: true, userId: 'test-user-id' },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      await notificationController.getNotifications(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.notification.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockRequest.params = { id: 'notif-1' };
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await notificationController.markAsRead(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1', userId: 'test-user-id' },
          data: { read: true },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await notificationController.markAllAsRead(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'test-user-id', read: false },
          data: { read: true },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockRequest.params = { id: 'notif-1' };
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });

      await notificationController.deleteNotification(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1', userId: 'test-user-id' },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for the user', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      await notificationController.deleteAllNotifications(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'test-user-id' },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('createNotification (helper)', () => {
    it('should create a notification for a user', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'new-notif',
        userId: 'user-1',
        type: 'DEAL_WON',
        title: 'Deal Won!',
        message: 'Big deal closed',
      });

      await notificationController.createNotification(
        'user-1',
        'DEAL_WON' as any,
        'Deal Won!',
        'Big deal closed'
      );

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            title: 'Deal Won!',
            message: 'Big deal closed',
          }),
        })
      );
    });
  });
});
