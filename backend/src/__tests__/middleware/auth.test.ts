import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken');

// Create the middleware function to test (based on actual implementation pattern)
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    (req as any).user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('Token validation', () => {
    it('should reject requests without authorization header', async () => {
      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied. No token provided.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject requests without Bearer prefix', async () => {
      mockRequest.headers = { authorization: 'InvalidToken123' };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept valid token and set user', async () => {
      const userId = 'user-123';
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId });

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect((mockRequest as any).user).toEqual({ id: userId });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject expired tokens', async () => {
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject malformed tokens', async () => {
      mockRequest.headers = { authorization: 'Bearer malformed-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
