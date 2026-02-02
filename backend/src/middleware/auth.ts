import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

/**
 * Authentication Middleware
 * يتحقق من وجود وصحة الـ JWT Token
 * 
 * الاستخدام: يحمي الـ routes التي تحتاج مصادقة
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
        id: string;
        email: string;
      };

      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
    return;
  }
};
