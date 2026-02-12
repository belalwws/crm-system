import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  team: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  teamMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
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

import { getTeams, createTeam, addTeamMember, removeTeamMember, deleteTeam } from '../../controllers/teamController';

describe('Team Controller', () => {
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

  describe('getTeams', () => {
    it('should return teams the user belongs to', async () => {
      const teams = [{ id: 't1', name: 'Sales', members: [], _count: { members: 1 } }];
      mockPrisma.team.findMany.mockResolvedValue(teams);

      await getTeams(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: teams });
    });
  });

  describe('createTeam', () => {
    it('should create team with owner membership', async () => {
      req.body = { name: 'Dev Team', description: 'Engineers' };
      const team = { id: 't1', name: 'Dev Team', members: [{ userId: 'user-1', role: 'OWNER' }] };
      mockPrisma.team.create.mockResolvedValue(team);

      await createTeam(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            members: { create: { userId: 'user-1', role: 'OWNER' } },
          }),
        }),
      );
    });

    it('should reject without name', async () => {
      req.body = {};
      await createTeam(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addTeamMember', () => {
    it('should add member when requester is owner/admin', async () => {
      req.params = { id: 't1' };
      req.body = { userId: 'user-2', role: 'MEMBER' };
      mockPrisma.teamMember.findFirst.mockResolvedValue({ userId: 'user-1', role: 'OWNER' });
      mockPrisma.teamMember.create.mockResolvedValue({ userId: 'user-2', role: 'MEMBER' });

      await addTeamMember(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject if requester is not owner/admin', async () => {
      req.params = { id: 't1' };
      req.body = { userId: 'user-2' };
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await addTeamMember(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject without userId', async () => {
      req.params = { id: 't1' };
      req.body = {};

      await addTeamMember(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('removeTeamMember', () => {
    it('should remove member when authorized', async () => {
      req.params = { id: 't1', userId: 'user-2' };
      mockPrisma.teamMember.findFirst.mockResolvedValue({ userId: 'user-1', role: 'OWNER' });
      mockPrisma.teamMember.deleteMany.mockResolvedValue({ count: 1 });

      await removeTeamMember(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should reject if not authorized', async () => {
      req.params = { id: 't1', userId: 'user-2' };
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await removeTeamMember(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteTeam', () => {
    it('should delete when requester is owner', async () => {
      req.params = { id: 't1' };
      mockPrisma.teamMember.findFirst.mockResolvedValue({ userId: 'user-1', role: 'OWNER' });
      mockPrisma.team.delete.mockResolvedValue({});

      await deleteTeam(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should reject if not owner', async () => {
      req.params = { id: 't1' };
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await deleteTeam(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
