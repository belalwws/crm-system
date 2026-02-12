import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  auditLog: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

import { getAuditLogs, getEntityAuditTrail } from '../../controllers/auditLogController';

describe('AuditLog Controller', () => {
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

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const logs = [{ id: 'al1', action: 'CREATE', entityType: 'Customer' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(logs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      await getAuditLogs(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data).toEqual(logs);
      expect(body.total).toBe(1);
    });

    it('should filter by entityType', async () => {
      req.query = { entityType: 'Deal' };
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await getAuditLogs(req as AuthRequest, res as Response);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', entityType: 'Deal' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await getAuditLogs(req as AuthRequest, res as Response);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should handle errors', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('DB error'));
      await getAuditLogs(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEntityAuditTrail', () => {
    it('should return audit trail for specific entity', async () => {
      req.params = { entityType: 'Customer', entityId: 'c1' };
      const logs = [{ id: 'al1', action: 'UPDATE' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(logs);

      await getEntityAuditTrail(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'Customer',
            entityId: 'c1',
          }),
        }),
      );
    });
  });
});
