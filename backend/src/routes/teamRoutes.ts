import express from 'express';
import { getTeams, createTeam, addTeamMember, removeTeamMember, deleteTeam } from '../controllers/teamController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', getTeams);
router.post('/', createTeam);
router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:userId', removeTeamMember);
router.delete('/:id', deleteTeam);

export default router;
