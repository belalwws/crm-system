import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * @desc    Get current user's full profile
 * @route   GET /api/profile
 * @access  Private
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        avatar: true,
        phone: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            deals: true,
            tasksAssigned: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, company, phone, timezone, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(timezone !== undefined && { timezone }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        avatar: true,
        phone: true,
        timezone: true,
        isActive: true,
      },
    });

    res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * @desc    Change password  
 * @route   POST /api/profile/change-password
 * @access  Private
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Clerk managed users can't change password here
    if (user.password === 'clerk_managed') {
      res.status(400).json({ success: false, message: 'Password is managed by Clerk. Update it through your Clerk account.' });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const rounds = process.env.NODE_ENV === 'production' ? 12 : 4;
    const salt = await bcrypt.genSalt(rounds);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    logger.info(`User ${req.user!.email} changed their password`);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

/**
 * @desc    Get user preferences
 * @route   GET /api/profile/preferences
 * @access  Private
 */
export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.id },
    });

    if (!prefs) {
      // Create defaults
      prefs = await prisma.userPreferences.create({
        data: { userId: req.user!.id },
      });
    }

    res.json({ success: true, data: prefs });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/profile/preferences
 * @access  Private
 */
export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      emailTaskReminders,
      emailDealUpdates,
      emailWeeklyDigest,
      pushTaskReminders,
      pushDealWon,
      pushNewCustomer,
      emailSignature,
      defaultCc,
      replyTo,
      displayDensity,
    } = req.body;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...(emailTaskReminders !== undefined && { emailTaskReminders }),
        ...(emailDealUpdates !== undefined && { emailDealUpdates }),
        ...(emailWeeklyDigest !== undefined && { emailWeeklyDigest }),
        ...(pushTaskReminders !== undefined && { pushTaskReminders }),
        ...(pushDealWon !== undefined && { pushDealWon }),
        ...(pushNewCustomer !== undefined && { pushNewCustomer }),
        ...(emailSignature !== undefined && { emailSignature }),
        ...(defaultCc !== undefined && { defaultCc }),
        ...(replyTo !== undefined && { replyTo }),
        ...(displayDensity !== undefined && { displayDensity }),
      },
      update: {
        ...(emailTaskReminders !== undefined && { emailTaskReminders }),
        ...(emailDealUpdates !== undefined && { emailDealUpdates }),
        ...(emailWeeklyDigest !== undefined && { emailWeeklyDigest }),
        ...(pushTaskReminders !== undefined && { pushTaskReminders }),
        ...(pushDealWon !== undefined && { pushDealWon }),
        ...(pushNewCustomer !== undefined && { pushNewCustomer }),
        ...(emailSignature !== undefined && { emailSignature }),
        ...(defaultCc !== undefined && { defaultCc }),
        ...(replyTo !== undefined && { replyTo }),
        ...(displayDensity !== undefined && { displayDensity }),
      },
    });

    res.json({ success: true, data: prefs, message: 'Preferences saved successfully' });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};
