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
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  deal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  activity: {
    findFirst: jest.fn(),
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

      mockPrisma.customer.count.mockResolvedValue(10);
      mockPrisma.deal.count.mockResolvedValue(5);
      mockPrisma.task.count.mockResolvedValue(3);

      (aiLib.aiChat as jest.Mock).mockResolvedValue({
        content: 'Hello! How can I help?',
        model: 'meta/llama-3.3-70b-instruct',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
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
        purpose: 'Write a follow-up email',
        customerId: 'c1',
        tone: 'professional',
      };

      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'c1',
        name: 'Test Customer',
        company: 'Test Corp',
        deals: [],
      });

      (aiLib.aiComposeEmail as jest.Mock).mockResolvedValue({
        content: 'Dear Customer...',
        model: 'meta/llama-3.3-70b-instruct',
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
            email: 'Dear Customer...',
          }),
        })
      );
    });
  });

  describe('dashboardInsights', () => {
    it('should return AI-generated dashboard insights', async () => {
      mockPrisma.customer.count.mockResolvedValue(10);
      mockPrisma.deal.count.mockResolvedValue(5);
      mockPrisma.task.count.mockResolvedValue(3);
      mockPrisma.deal.aggregate.mockResolvedValue({ _sum: { value: 100000 } });

      (aiLib.aiDashboardInsights as jest.Mock).mockResolvedValue({
        content: 'Your sales are trending up',
        model: 'meta/llama-3.3-70b-instruct',
      });

      await aiController.dashboardInsights(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiDashboardInsights).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            insights: 'Your sales are trending up',
          }),
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
        company: 'Test Corp',
        status: 'ACTIVE',
        deals: [],
        tasks: [],
        notes: [],
      };

      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.activity.findFirst.mockResolvedValue(null);

      (aiLib.aiCustomerInsights as jest.Mock).mockResolvedValue({
        content: 'High-value customer with growth potential',
        model: 'meta/llama-3.3-70b-instruct',
      });

      await aiController.customerInsights(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(aiLib.aiCustomerInsights).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            insights: 'High-value customer with growth potential',
          }),
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
