import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  meeting: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
  },
  deal: {
    findFirst: jest.fn(),
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

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import * as meetingController from '../../controllers/meetingController';

describe('Meeting Controller', () => {
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

  describe('getMeetings', () => {
    it('should return meetings for the user', async () => {
      const mockMeetings = [
        { id: '1', title: 'Sales Call', startTime: new Date(), customer: null, deal: null },
        { id: '2', title: 'Demo', startTime: new Date(), customer: null, deal: null },
      ];

      mockPrisma.meeting.findMany.mockResolvedValue(mockMeetings);
      mockPrisma.meeting.count.mockResolvedValue(2);

      await meetingController.getMeetings(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.meeting.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('getMeeting', () => {
    it('should return a single meeting', async () => {
      mockRequest.params = { id: 'meeting-1' };
      const mockMeeting = { id: 'meeting-1', title: 'Sales Call', ownerId: 'test-user-id', customer: null, deal: null };
      mockPrisma.meeting.findFirst.mockResolvedValue(mockMeeting);

      await meetingController.getMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 if meeting not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      await meetingController.getMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createMeeting', () => {
    it('should create a new meeting', async () => {
      mockRequest.body = {
        title: 'New Meeting',
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
        description: 'Quarterly review',
      };
      const mockMeeting = {
        id: 'meeting-1',
        title: 'New Meeting',
        startTime: new Date('2025-01-15T10:00:00Z'),
        endTime: new Date('2025-01-15T11:00:00Z'),
        ownerId: 'test-user-id',
        customer: null,
        deal: null,
      };
      mockPrisma.meeting.create.mockResolvedValue(mockMeeting);

      await meetingController.createMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.meeting.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateMeeting', () => {
    it('should update an existing meeting', async () => {
      mockRequest.params = { id: 'meeting-1' };
      mockRequest.body = { title: 'Updated Meeting' };
      const existing = { id: 'meeting-1', ownerId: 'test-user-id', title: 'Old' };
      mockPrisma.meeting.findFirst.mockResolvedValue(existing);
      mockPrisma.meeting.update.mockResolvedValue({ ...existing, title: 'Updated Meeting', customer: null, deal: null });

      await meetingController.updateMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.meeting.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 if meeting not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { title: 'Updated' };
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      await meetingController.updateMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteMeeting', () => {
    it('should soft delete a meeting', async () => {
      mockRequest.params = { id: 'meeting-1' };
      const existing = { id: 'meeting-1', ownerId: 'test-user-id', title: 'Meeting' };
      mockPrisma.meeting.findFirst.mockResolvedValue(existing);
      mockPrisma.meeting.update.mockResolvedValue({ ...existing, deletedAt: new Date() });

      await meetingController.deleteMeeting(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meeting-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
