import express from 'express';
import { protect } from '../middleware/auth';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

const router = express.Router();

/**
 * @desc    Register push token from mobile device
 * @route   POST /api/push-tokens
 * @access  Authenticated
 */
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { token, platform, deviceName } = req.body;

    if (!token || !platform) {
      res.status(400).json({ success: false, message: 'token and platform are required' });
      return;
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: req.user!.id,
        platform,
        deviceName: deviceName || null,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user!.id,
        token,
        platform,
        deviceName: deviceName || null,
      },
    });

    res.json({ success: true, data: pushToken });
  } catch (error) {
    logger.error('Error registering push token:', error);
    res.status(500).json({ success: false, message: 'Failed to register push token' });
  }
});

/**
 * @desc    Deactivate push token (logout)
 * @route   DELETE /api/push-tokens
 * @access  Authenticated
 */
router.delete('/', protect, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await prisma.pushToken.updateMany({
        where: { token, userId: req.user!.id },
        data: { isActive: false },
      });
    }
    res.json({ success: true, message: 'Push token deactivated' });
  } catch (error) {
    logger.error('Error deactivating push token:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate push token' });
  }
});

export default router;
