import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, sendVerification, verifyEmail } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../lib/validators';

const router = express.Router();

/**
 * Authentication Routes
 */
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email Verification
router.post('/send-verification', protect, sendVerification);
router.post('/verify-email', verifyEmail);

export default router;
