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
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: { user: mockPrismaUser },
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Import actual controllers AFTER mocks
import { register, login } from '../../controllers/authController';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Controller (real imports)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    req = { body: {} };
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
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

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
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res as Response);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.user).not.toHaveProperty('password');
    });
  });
});
