import express from 'express';
// CHANGE 1: Import 'protect' instead of 'requireAuth'
import { protect } from '../middlewares/authMiddleware.js'; 
import validateResource from '../middlewares/validateResource.js';
import { onboardingSchema } from '../utils/schemas/auth.schema.js';
import { onboardUser, getCurrentUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post(
  '/onboarding', 
  protect, // CHANGE 2: Use 'protect' here
  validateResource(onboardingSchema), 
  onboardUser
);

router.get('/me', protect, getCurrentUser); // CHANGE 3: Use 'protect' here

export default router;