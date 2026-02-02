import { Request } from 'express';

/**
 * Extended Request type to include authenticated user
 * نضيف معلومات المستخدم المسجل للـ Request
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * User Registration Input
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  company?: string;
}

/**
 * User Login Input
 */
export interface LoginInput {
  email: string;
  password: string;
}
