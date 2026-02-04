import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
} from '../controllers/noteController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/notes - Get notes
router.get('/', getNotes);

// POST /api/notes - Create note
router.post('/', createNote);

// PUT /api/notes/:id - Update note
router.put('/:id', updateNote);

// POST /api/notes/:id/toggle-pin - Toggle pin
router.post('/:id/toggle-pin', togglePinNote);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', deleteNote);

export default router;
