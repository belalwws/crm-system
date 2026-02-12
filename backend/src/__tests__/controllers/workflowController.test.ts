import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  workflowRule: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workflowLog: {
    findMany: jest.fn(),
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

import {
  getWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  getWorkflowLogs,
  toggleWorkflowRule,
} from '../../controllers/workflowController';

describe('Workflow Controller', () => {
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

  describe('getWorkflowRules', () => {
    it('should return workflow rules for owner', async () => {
      const rules = [{ id: 'w1', name: 'Auto-assign', _count: { logs: 5 } }];
      mockPrisma.workflowRule.findMany.mockResolvedValue(rules);

      await getWorkflowRules(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: rules });
    });
  });

  describe('createWorkflowRule', () => {
    it('should create rule with required fields', async () => {
      req.body = { name: 'Rule 1', trigger: 'DEAL_CREATED', conditions: {}, actions: [] };
      mockPrisma.workflowRule.create.mockResolvedValue({ id: 'w1', name: 'Rule 1' });

      await createWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject missing required fields', async () => {
      req.body = { name: 'Rule 1' };
      await createWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateWorkflowRule', () => {
    it('should update existing rule', async () => {
      req.params = { id: 'w1' };
      req.body = { name: 'Updated Rule' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue({ id: 'w1' });
      mockPrisma.workflowRule.update.mockResolvedValue({ id: 'w1', name: 'Updated Rule' });

      await updateWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue(null);

      await updateWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteWorkflowRule', () => {
    it('should delete existing rule', async () => {
      req.params = { id: 'w1' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue({ id: 'w1' });
      mockPrisma.workflowRule.delete.mockResolvedValue({});

      await deleteWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue(null);

      await deleteWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getWorkflowLogs', () => {
    it('should return logs for a rule', async () => {
      req.params = { id: 'w1' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue({ id: 'w1' });
      mockPrisma.workflowLog.findMany.mockResolvedValue([{ id: 'l1', status: 'SUCCESS' }]);

      await getWorkflowLogs(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if rule not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue(null);

      await getWorkflowLogs(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('toggleWorkflowRule', () => {
    it('should toggle active state', async () => {
      req.params = { id: 'w1' };
      mockPrisma.workflowRule.findFirst.mockResolvedValue({ id: 'w1', isActive: true });
      mockPrisma.workflowRule.update.mockResolvedValue({ id: 'w1', isActive: false });

      await toggleWorkflowRule(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.workflowRule.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });
  });
});
