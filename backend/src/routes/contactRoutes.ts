import express from 'express';
import { getContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
