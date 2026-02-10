import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userPreferences: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import * as profileController from '../../controllers/profileController';

describe('Profile Controller', () => {
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

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'USER',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await profileController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-user-id' },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await profileController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockRequest.body = { name: 'Updated Name', phone: '+1234567890' };
      const updatedUser = {
        id: 'test-user-id',
        name: 'Updated Name',
        phone: '+1234567890',
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await profileController.updateProfile(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-user-id' },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockPrefs = {
        userId: 'test-user-id',
        emailTaskReminders: true,
        emailDealUpdates: true,
      };
      mockPrisma.userPreferences.findUnique.mockResolvedValue(mockPrefs);

      await profileController.getPreferences(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.userPreferences.findUnique).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('updatePreferences', () => {
    it('should upsert user preferences', async () => {
      mockRequest.body = { emailTaskReminders: false, displayDensity: 'compact' };
      const mockPrefs = {
        userId: 'test-user-id',
        emailTaskReminders: false,
        displayDensity: 'compact',
      };
      mockPrisma.userPreferences.upsert.mockResolvedValue(mockPrefs);

      await profileController.updatePreferences(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.userPreferences.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'test-user-id' },
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
