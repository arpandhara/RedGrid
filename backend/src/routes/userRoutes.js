import express from 'express';
import { getUserById, updateProfile } from '../controllers/userController.js';
// CHANGE THIS LINE:
import { protect } from '../middlewares/authMiddleware.js';
import { requireOnboarding } from '../middlewares/checkOnboarding.js';

const router = express.Router();


router.get('/:id', protect, getUserById);
router.put('/profile', protect, requireOnboarding, updateProfile);

export default router;