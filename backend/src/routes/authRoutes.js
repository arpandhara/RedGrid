import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { clerkWebhook, onboardUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();


router.post('/webhook', express.raw({ type: 'application/json' }), clerkWebhook);
router.post('/onboarding', requireAuth, onboardUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;