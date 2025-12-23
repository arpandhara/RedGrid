import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import validateResource from '../middlewares/validateResource.js';
import { onboardingSchema } from '../utils/schemas/auth.schema.js';
import { onboardUser, getCurrentUser , forgotPassword , resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post(
  '/onboarding', 
  requireAuth, 
  validateResource(onboardingSchema), 
  onboardUser
);
router.get('/me', requireAuth, getCurrentUser);

export default router;