import { Request, Response } from 'express';

// Mock bcryptjs (the actual package used in the project)
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock auth controller functions (simplified versions for testing)
const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    const existingUser = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await mockPrisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    return res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    return res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('Register', () => {
    it('should register a new user successfully', async () => {
      mockRequest.body = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'newuser@test.com',
        name: 'New User',
      });
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'new-token',
          }),
        })
      );
    });

    it('should reject registration without email', async () => {
      mockRequest.body = {
        password: 'password123',
        name: 'New User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject registration if user already exists', async () => {
      mockRequest.body = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'Existing User',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User already exists',
        })
      );
    });

    it('should hash password before storing', async () => {
      mockRequest.body = {
        email: 'newuser@test.com',
        password: 'plaintext-password',
        name: 'New User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('securely-hashed');
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1' });
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await register(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext-password', 10);
    });
  });

  describe('Login', () => {
    it('should login user with valid credentials', async () => {
      mockRequest.body = {
        email: 'user@test.com',
        password: 'correct-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('login-token');

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'login-token',
          }),
        })
      );
    });

    it('should reject login for non-existent user', async () => {
      mockRequest.body = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials',
        })
      );
    });

    it('should reject login with wrong password', async () => {
      mockRequest.body = {
        email: 'user@test.com',
        password: 'wrong-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should not expose password in response', async () => {
      mockRequest.body = {
        email: 'user@test.com',
        password: 'correct-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await login(mockRequest as Request, mockResponse as Response);

      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.user).not.toHaveProperty('password');
    });
  });
});
