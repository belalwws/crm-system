import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  quote: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  lineItem: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
}));

import { getQuotes, getQuote } from '../../controllers/quoteController';

describe('Quote Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-1', email: 'test@test.com' },
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getQuotes', () => {
    it('should return paginated quotes', async () => {
      const quotes = [{ id: 'q1', quoteNumber: 'QT-2025-0001', lineItems: [] }];
      mockPrisma.quote.findMany.mockResolvedValue(quotes);
      mockPrisma.quote.count.mockResolvedValue(1);

      await getQuotes(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: quotes, total: 1 }),
      );
    });

    it('should filter by status', async () => {
      req.query = { status: 'SENT' };
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.quote.count.mockResolvedValue(0);

      await getQuotes(req as AuthRequest, res as Response);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should handle errors', async () => {
      mockPrisma.quote.findMany.mockRejectedValue(new Error('DB error'));
      await getQuotes(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getQuote', () => {
    it('should return a single quote with line items', async () => {
      req.params = { id: 'q1' };
      const quote = { id: 'q1', quoteNumber: 'QT-2025-0001', lineItems: [] };
      mockPrisma.quote.findFirst.mockResolvedValue(quote);

      await getQuote(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: quote });
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.quote.findFirst.mockResolvedValue(null);

      await getQuote(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
