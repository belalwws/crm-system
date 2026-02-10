import express from 'express';
import { getQuotes, getQuote, createQuote, updateQuote, deleteQuote, sendQuote } from '../controllers/quoteController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', getQuotes);
router.get('/:id', getQuote);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);
router.post('/:id/send', sendQuote);

export default router;
