import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  customer: {
    findFirst: jest.fn(),
  },
  deal: {
    findFirst: jest.fn(),
  },
  timelineEvent: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

import { getCustomerTimeline, getDealTimeline } from '../../controllers/timelineController';

describe('Timeline Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-1', email: 'test@test.com' },
      query: {},
      params: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getCustomerTimeline', () => {
    it('should return paginated timeline events', async () => {
      req.params = { customerId: 'c1' };
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', ownerId: 'user-1' });
      mockPrisma.timelineEvent.findMany.mockResolvedValue([{ id: 'te1', type: 'NOTE' }]);
      mockPrisma.timelineEvent.count.mockResolvedValue(1);

      await getCustomerTimeline(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('should return 404 if customer not found', async () => {
      req.params = { customerId: 'missing' };
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await getCustomerTimeline(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should filter by type', async () => {
      req.params = { customerId: 'c1' };
      req.query = { type: 'DEAL_WON' };
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1' });
      mockPrisma.timelineEvent.findMany.mockResolvedValue([]);
      mockPrisma.timelineEvent.count.mockResolvedValue(0);

      await getCustomerTimeline(req as AuthRequest, res as Response);
      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'DEAL_WON' }),
        }),
      );
    });
  });

  describe('getDealTimeline', () => {
    it('should return timeline events for a deal', async () => {
      req.params = { dealId: 'd1' };
      mockPrisma.deal.findFirst.mockResolvedValue({ id: 'd1', ownerId: 'user-1' });
      mockPrisma.timelineEvent.findMany.mockResolvedValue([{ id: 'te1' }]);
      mockPrisma.timelineEvent.count.mockResolvedValue(1);

      await getDealTimeline(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if deal not found', async () => {
      req.params = { dealId: 'missing' };
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await getDealTimeline(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
