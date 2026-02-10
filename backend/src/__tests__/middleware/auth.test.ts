import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

const mockPrismaUser = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
};

jest.mock('../../lib/prisma', () => {
  const actual = {
    user: mockPrismaUser,
  };
  return {
    __esModule: true,
    default: actual,
    prisma: actual,
    withRetry: (fn: () => any) => fn(),
  };
});

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Import AFTER mocks
import { protect } from '../../middleware/auth';
import { verifyToken } from '@clerk/backend';

describe('Auth Middleware (protect)', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.CLERK_SECRET_KEY = 'test-clerk-secret';

    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should reject requests without Authorization header', async () => {
    await protect(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests with empty Bearer token', async () => {
    req.headers = { authorization: 'Bearer ' };
    // jwt.decode will get '' which is falsy
    (jwt.decode as jest.Mock).mockReturnValue(null);

    await protect(req as AuthRequest, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  describe('Local JWT tokens', () => {
    const localPayload = { id: 'user-123', email: 'test@test.com' };
    const mockUser = { id: 'user-123', email: 'test@test.com', role: 'USER', isActive: true, name: 'Test' };

    beforeEach(() => {
      req.headers = { authorization: 'Bearer local-token-123' };
      // Not a Clerk token (no sub/azp/clerk issuer)
      (jwt.decode as jest.Mock).mockReturnValue({
        payload: { id: 'user-123', email: 'test@test.com' },
      });
    });

    it('should authenticate valid local JWT and attach user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(localPayload);
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      await protect(req as AuthRequest, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith('local-token-123', 'test-jwt-secret', { algorithms: ['HS256'] });
      expect(req.user).toEqual({ id: 'user-123', email: 'test@test.com', role: 'USER', name: 'Test' });
      expect(next).toHaveBeenCalled();
    });

    it('should reject if JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid local JWT', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject deactivated users', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(localPayload);
      mockPrismaUser.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user not found in DB', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(localPayload);
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Clerk tokens', () => {
    const mockUser = { id: 'clerk_user_123', email: 'clerk@test.com', role: 'USER', isActive: true, name: 'ClerkUser' };

    beforeEach(() => {
      req.headers = { authorization: 'Bearer clerk-jwt-token' };
      // Clerk token has sub + azp
      (jwt.decode as jest.Mock).mockReturnValue({
        payload: { sub: 'clerk_user_123', azp: 'my-app', exp: 99999999999, iat: 1000000 },
      });
    });

    it('should verify Clerk token cryptographically and attach user', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({
        sub: 'clerk_user_123',
        email: 'clerk@test.com',
        name: 'ClerkUser',
      });
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      await protect(req as AuthRequest, res as Response, next);

      expect(verifyToken).toHaveBeenCalledWith('clerk-jwt-token', { secretKey: 'test-clerk-secret' });
      expect(req.user).toEqual({ id: 'clerk_user_123', email: 'clerk@test.com', role: 'USER', name: 'ClerkUser' });
      expect(next).toHaveBeenCalled();
    });

    it('should auto-create user from Clerk if not found', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({
        sub: 'new_clerk_user',
        email: 'new@clerk.com',
        name: 'New Clerk',
      });
      mockPrismaUser.findFirst.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue({
        id: 'new_clerk_user', email: 'new@clerk.com', role: 'USER', isActive: true, name: 'New Clerk',
      });

      await protect(req as AuthRequest, res as Response, next);
      expect(mockPrismaUser.create).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should reject if Clerk signature verification fails', async () => {
      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid signature'));

      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if CLERK_SECRET_KEY is missing', async () => {
      delete process.env.CLERK_SECRET_KEY;
      await protect(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

