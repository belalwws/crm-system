import { Request, Response } from 'express';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
  decode: jest.fn(),
}));

const mockPrismaUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaRefreshToken = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: { user: mockPrismaUser, refreshToken: mockPrismaRefreshToken },
  prisma: { user: mockPrismaUser, refreshToken: mockPrismaRefreshToken },
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Mock email module to prevent Resend API key error
jest.mock('../../lib/email', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}));

// Import actual controllers AFTER mocks
import { register, login, refreshAccessToken, logout, logoutAll, listSessions, forgotPassword, getMe } from '../../controllers/authController';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types';

describe('Auth Controller (real imports)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    req = {
      body: {},
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('register()', () => {
    it('should register a new user successfully', async () => {
      req.body = { email: 'new@test.com', password: 'Password1!', name: 'New User' };
      mockPrismaUser.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrismaUser.create.mockResolvedValue({
        id: 'u1', email: 'new@test.com', name: 'New User', company: null, role: 'USER',
      });
      mockPrismaRefreshToken.create.mockResolvedValue({});

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'mock-token' }),
      }));
    });

    it('should reject duplicate email', async () => {
      req.body = { email: 'dup@test.com', password: 'Password1!', name: 'Dup' };
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'existing' });

      await register(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should hash password with bcrypt salt 12', async () => {
      req.body = { email: 'hash@test.com', password: 'Password1!', name: 'Hash' };
      mockPrismaUser.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrismaUser.create.mockResolvedValue({ id: 'u2', email: 'hash@test.com', name: 'Hash', role: 'USER' });

      await register(req as Request, res as Response);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 'mock-salt');
    });
  });

  describe('login()', () => {
    it('should login with valid credentials', async () => {
      req.body = { email: 'user@test.com', password: 'correct' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', email: 'user@test.com', name: 'User', password: 'hashed', role: 'USER', isActive: true,
        failedLoginAttempts: 0, lockedUntil: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({});

      await login(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'mock-token' }),
      }));
    });

    it('should reject non-existent user', async () => {
      req.body = { email: 'nobody@test.com', password: 'pass' };
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await login(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject wrong password', async () => {
      req.body = { email: 'user@test.com', password: 'wrong' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', email: 'user@test.com', password: 'hashed', isActive: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject missing email/password', async () => {
      req.body = { email: '', password: '' };
      await login(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should not expose password in response', async () => {
      req.body = { email: 'user@test.com', password: 'correct' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', email: 'user@test.com', name: 'User', password: 'hashed', role: 'USER', company: null, isActive: true,
        failedLoginAttempts: 0, lockedUntil: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({});

      await login(req as Request, res as Response);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.user).not.toHaveProperty('password');
    });

    it('should return 423 when account is locked', async () => {
      req.body = { email: 'locked@test.com', password: 'pass' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', email: 'locked@test.com', password: 'hashed', isActive: true,
        lockedUntil: new Date(Date.now() + 600000),
        failedLoginAttempts: 10,
      });

      await login(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(423);
    });

    it('should increment failed attempts on wrong password', async () => {
      req.body = { email: 'user@test.com', password: 'wrong' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', email: 'user@test.com', password: 'hashed', isActive: true,
        failedLoginAttempts: 5, lockedUntil: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrismaUser.update.mockResolvedValue({});

      await login(req as Request, res as Response);
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ failedLoginAttempts: 6 }) }),
      );
    });
  });

  // ── Refresh Access Token ──────────────────────────────
  describe('refreshAccessToken()', () => {
    it('should return 400 without refresh token', async () => {
      req.body = {};
      await refreshAccessToken(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 for invalid token', async () => {
      req.body = { refreshToken: 'bad-token' };
      mockPrismaRefreshToken.findFirst.mockResolvedValue(null);
      await refreshAccessToken(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 for deactivated user', async () => {
      req.body = { refreshToken: 'token-for-inactive' };
      mockPrismaRefreshToken.findFirst.mockResolvedValue({
        id: 'rt1', user: { id: 'u1', email: 'a@b.com', role: 'USER', isActive: false },
      });
      mockPrismaRefreshToken.update.mockResolvedValue({});
      await refreshAccessToken(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should rotate and return new tokens on success', async () => {
      req.body = { refreshToken: 'valid-token' };
      (req as any).headers = { 'user-agent': 'test' };
      (req as any).ip = '127.0.0.1';
      (req as any).socket = { remoteAddress: '127.0.0.1' };
      mockPrismaRefreshToken.findFirst.mockResolvedValue({
        id: 'rt1', user: { id: 'u1', email: 'a@b.com', role: 'USER', isActive: true },
      });
      mockPrismaRefreshToken.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({});

      await refreshAccessToken(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrismaRefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt1' } }),
      );
      expect(mockPrismaRefreshToken.create).toHaveBeenCalled();
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.data.token).toBe('mock-token');
      expect(body.data.refreshToken).toBeDefined();
    });
  });

  // ── Logout ────────────────────────────────────────────
  describe('logout()', () => {
    it('should revoke provided refresh token', async () => {
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      req.body = { refreshToken: 'some-token' };
      mockPrismaRefreshToken.updateMany.mockResolvedValue({ count: 1 });

      await logout(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrismaRefreshToken.updateMany).toHaveBeenCalled();
    });

    it('should succeed without refresh token body', async () => {
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      req.body = {};

      await logout(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Logout All ────────────────────────────────────────
  describe('logoutAll()', () => {
    it('should revoke all tokens for authenticated user', async () => {
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      mockPrismaRefreshToken.updateMany.mockResolvedValue({ count: 3 });

      await logoutAll(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrismaRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) }),
      );
    });

    it('should return 401 when not authenticated', async () => {
      (req as any).user = undefined;
      await logoutAll(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ── List Sessions ─────────────────────────────────────
  describe('listSessions()', () => {
    it('should return active sessions', async () => {
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      mockPrismaRefreshToken.findMany.mockResolvedValue([
        { id: 'rt1', userAgent: 'Chrome', ipAddress: '1.2.3.4', createdAt: new Date(), expiresAt: new Date() },
      ]);

      await listSessions(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 when not authenticated', async () => {
      (req as any).user = undefined;
      await listSessions(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ── Forgot Password ───────────────────────────────────
  describe('forgotPassword()', () => {
    it('should return 400 without email', async () => {
      req.body = {};
      await forgotPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 for non-existent email (anti-enumeration)', async () => {
      req.body = { email: 'nobody@x.com' };
      mockPrismaUser.findUnique.mockResolvedValue(null);
      await forgotPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Get Me ────────────────────────────────────────────
  describe('getMe()', () => {
    it('should return current user data', async () => {
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'u1', name: 'Test', email: 'a@b.com', company: 'Co', role: 'USER', createdAt: new Date(),
      });

      await getMe(req as unknown as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
