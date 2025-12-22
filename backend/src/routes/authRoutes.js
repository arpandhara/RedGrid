import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import validateResource from '../middlewares/validateResource.js';
import { onboardingSchema } from '../utils/schemas/auth.schema.js';
import { onboardUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// Apply validation middleware before the controller
router.post(
  '/onboarding', 
  requireAuth, 
  validateResource(onboardingSchema), 
  onboardUser
);

router.get('/me', requireAuth, getCurrentUser);

export default router;