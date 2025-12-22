import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { onboardUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/onboarding', requireAuth, onboardUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;