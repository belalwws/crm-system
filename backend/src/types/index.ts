import { Request } from 'express';

/**
 * Extended Request type to include authenticated user
 * نضيف معلومات المستخدم المسجل للـ Request
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
  };
}

/**
 * Helper to safely get authenticated user ID.
 * Throws 401 error if user is not authenticated.
 */
export function getAuthUserId(req: AuthRequest): string {
  if (!req.user?.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
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
