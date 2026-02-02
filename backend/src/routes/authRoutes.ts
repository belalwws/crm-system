import express from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Authentication Routes
 */
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
