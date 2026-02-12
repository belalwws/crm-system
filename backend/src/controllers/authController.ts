import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest, RegisterInput, LoginInput } from '../types';
import logger from '../lib/logger';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email';

// ── Constants ────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY = '30m'; // short-lived
const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_LOGINS = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Password policy: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  return null;
}

/**
 * Generate short-lived JWT Access Token (30 min)
 */
const generateAccessToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY };
  return jwt.sign({ id, email }, secret as Secret, options);
};

/**
 * Generate cryptographically secure refresh token
 * Returns { raw, hash } — store hash in DB, send raw to client.
 */
const generateRefreshToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, company }: RegisterInput = req.body;

    // Validate password strength
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      res.status(400).json({ success: false, message: pwError });
      return;
    }

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

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refresh = generateRefreshToken();

    // Store refresh token hash in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.hash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      },
    });

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
        token: accessToken,
        refreshToken: refresh.raw,
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

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Try again in ${remainingMin} minute(s).`,
      });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };
      if (failedAttempts >= MAX_FAILED_LOGINS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        logger.warn(`Account locked for ${email} after ${failedAttempts} failed attempts`);
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });

      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Successful login — reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refresh = generateRefreshToken();

    // Store refresh token hash in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.hash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      },
    });

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
        token: accessToken,
        refreshToken: refresh.raw,
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

    const pwError = validatePasswordStrength(password);
    if (pwError) {
      res.status(400).json({ success: false, message: pwError });
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

    // Revoke all refresh tokens on password change (force re-login on all devices)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

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

// ── Refresh Token Endpoints ──────────────────────────────

/**
 * @desc    Refresh access token using a valid refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: rawRefresh } = req.body;
    if (!rawRefresh) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!storedToken || !storedToken.user) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    if (!storedToken.user.isActive) {
      // Revoke the token if user is deactivated
      await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    // Rotate: revoke old token, issue new pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = generateAccessToken(storedToken.user.id, storedToken.user.email);
    const newRefresh = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newRefresh.hash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefresh.raw,
      },
    });
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Error refreshing token' });
  }
};

/**
 * @desc    Logout — revoke the provided refresh token (single session)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: rawRefresh } = req.body;
    if (rawRefresh) {
      const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};

/**
 * @desc    Logout all sessions — revoke all refresh tokens for user
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.status(200).json({ success: true, message: 'All sessions revoked' });
  } catch (error: any) {
    logger.error('Logout all error:', error);
    res.status(500).json({ success: false, message: 'Error revoking sessions' });
  }
};

/**
 * @desc    List active sessions for current user
 * @route   GET /api/auth/sessions
 * @access  Private
 */
export const listSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    logger.error('List sessions error:', error);
    res.status(500).json({ success: false, message: 'Error listing sessions' });
  }
};