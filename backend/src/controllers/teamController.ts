import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * @desc    Get teams the user belongs to
 * @route   GET /api/teams
 */
export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      where: { members: { some: { userId: req.user?.id } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    logger.error('Get teams error:', error);
    res.status(500).json({ success: false, message: 'Error fetching teams' });
  }
};

/**
 * @desc    Create team
 * @route   POST /api/teams
 */
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Team name is required' });
      return;
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: { userId: req.user?.id as string, role: 'OWNER' },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    logger.error('Create team error:', error);
    res.status(500).json({ success: false, message: 'Error creating team' });
  }
};

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 */
export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    // Verify requester is team owner/admin
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id, userId: req.user?.id, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!membership) {
      res.status(403).json({ success: false, message: 'Only team owners and admins can add members' });
      return;
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: req.params.id,
        userId,
        role: role || 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'User is already a team member' });
      return;
    }
    logger.error('Add team member error:', error);
    res.status(500).json({ success: false, message: 'Error adding team member' });
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 */
export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id, userId: req.user?.id, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!membership) {
      res.status(403).json({ success: false, message: 'Only team owners and admins can remove members' });
      return;
    }

    await prisma.teamMember.deleteMany({
      where: { teamId: req.params.id, userId: req.params.userId },
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    logger.error('Remove team member error:', error);
    res.status(500).json({ success: false, message: 'Error removing member' });
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 */
export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id, userId: req.user?.id, role: 'OWNER' },
    });

    if (!membership) {
      res.status(403).json({ success: false, message: 'Only team owner can delete the team' });
      return;
    }

    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    logger.error('Delete team error:', error);
    res.status(500).json({ success: false, message: 'Error deleting team' });
  }
};
