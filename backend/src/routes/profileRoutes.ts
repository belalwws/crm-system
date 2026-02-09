import express from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../lib/validators';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController';

const router = express.Router();
router.use(protect);

router.get('/', getProfile);
router.put('/', validate(updateUserSchema), updateProfile);
router.post('/change-password', changePassword);

export default router;
