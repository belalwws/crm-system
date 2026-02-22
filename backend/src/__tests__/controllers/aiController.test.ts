import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  chatSession: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  chatMessage: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  customer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  deal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/ai', () => ({
  aiChat: jest.fn(),
  aiComposeEmail: jest.fn(),
  aiDashboardInsights: jest.fn(),
  aiCustomerInsights: jest.fn(),
  aiDealAnalysis: jest.fn(),
  aiTaskPrioritization: jest.fn(),
  aiSummarize: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

import * as aiController from '../../controllers/aiController';
import * as aiLib from '../../lib/ai';

describe('AI Controller', () => {
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

  describe('chat', () => {
    it('should process chat message and return AI response', async () => {
      mockRequest.body = { message: 'Hello AI', sessionId: 's1' };

      (aiLib.aiChat as jest.Mock).mockResolvedValue({
        response: 'Hello! How can I help?',
        actions: [],
      });

      await aiController.chat(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiChat).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return 400 if message is missing', async () => {
      mockRequest.body = {};

      await aiController.chat(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('composeEmail', () => {
    it('should compose an email using AI', async () => {
      mockRequest.body = {
        prompt: 'Write a follow-up email',
        customerId: 'c1',
        tone: 'professional',
      };

      (aiLib.aiComposeEmail as jest.Mock).mockResolvedValue({
        subject: 'Follow-up',
        body: 'Dear Customer...',
      });

      await aiController.composeEmail(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiComposeEmail).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            subject: 'Follow-up',
          }),
        })
      );
    });
  });

  describe('dashboardInsights', () => {
    it('should return AI-generated dashboard insights', async () => {
      const mockInsights = {
        summary: 'Your sales are trending up',
        recommendations: ['Focus on qualified leads'],
      };

      (aiLib.aiDashboardInsights as jest.Mock).mockResolvedValue(mockInsights);

      await aiController.dashboardInsights(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiDashboardInsights).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockInsights,
        })
      );
    });
  });

  describe('customerInsights', () => {
    it('should return AI analysis for a customer', async () => {
      mockRequest.params = { customerId: 'c1' };

      const mockCustomer = {
        id: 'c1',
        name: 'Test Customer',
        email: 'test@example.com',
        deals: [],
        tasks: [],
      };

      const mockAnalysis = {
        score: 85,
        summary: 'High-value customer',
        recommendations: ['Upsell opportunity'],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      (aiLib.aiCustomerInsights as jest.Mock).mockResolvedValue(mockAnalysis);

      await aiController.customerInsights(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiCustomerInsights).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAnalysis,
        })
      );
    });
  });

  describe('prioritizeTasks', () => {
    it('should return prioritized tasks', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task 1', priority: 'HIGH', customer: null, deal: null },
        { id: 't2', title: 'Task 2', priority: 'LOW', customer: null, deal: null },
      ];

      const prioritizedTasks = [
        { ...mockTasks[0], aiReason: 'Customer is high value' },
        { ...mockTasks[1], aiReason: 'Can wait' },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);
      (aiLib.aiTaskPrioritization as jest.Mock).mockResolvedValue(prioritizedTasks);

      await aiController.prioritizeTasks(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
