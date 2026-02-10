import express from 'express';
import {
  getCustomFields, createCustomField, updateCustomField, deleteCustomField,
  getCustomFieldValues, setCustomFieldValues,
} from '../controllers/customFieldController';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', getCustomFields);
router.post('/', createCustomField);
router.put('/:id', updateCustomField);
router.delete('/:id', deleteCustomField);
router.get('/values/:entityId', getCustomFieldValues);
router.put('/values/:entityId', setCustomFieldValues);

export default router;
