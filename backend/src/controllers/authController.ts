import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest, RegisterInput, LoginInput } from '../types';
import logger from '../lib/logger';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email';

/**
 * Generate JWT Token
 */
const generateToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ id, email }, secret as Secret, options);
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, company }: RegisterInput = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
          role: user.role,
        },
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Check for user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact your administrator.',
      });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
          role: user.role,
        },
        token,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user data',
    });
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
      return;
    }

    // Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExp: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, user.name, resetUrl);

    res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

/**
 * @desc    Send email verification
 * @route   POST /api/auth/send-verification
 * @access  Private
 */
export const sendVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: hashedToken,
        verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    logger.error('Send verification error:', error);
    res.status(500).json({ success: false, message: 'Error sending verification email' });
  }
};

/**
 * @desc    Verify email with token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email } = req.body;
    if (!token || !email) {
      res.status(400).json({ success: false, message: 'Token and email are required' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        verifyToken: hashedToken,
        verifyTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    logger.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Error verifying email' });
  }
};