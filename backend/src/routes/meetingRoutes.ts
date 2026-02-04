import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getCalendarEvents,
  getUpcomingMeetings,
} from '../controllers/meetingController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/meetings/calendar - Get calendar events
router.get('/calendar', getCalendarEvents);

// GET /api/meetings/upcoming - Get upcoming meetings
router.get('/upcoming', getUpcomingMeetings);

// GET /api/meetings - Get all meetings
router.get('/', getMeetings);

// GET /api/meetings/:id - Get single meeting
router.get('/:id', getMeeting);

// POST /api/meetings - Create meeting
router.post('/', createMeeting);

// PUT /api/meetings/:id - Update meeting
router.put('/:id', updateMeeting);

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', deleteMeeting);

export default router;
