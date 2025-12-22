import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { onboardUser, getCurrentUser } from '../controllers/userController.js';

const router = express.Router();

// Route Definitions
router.post('/onboarding', ClerkExpressRequireAuth(), onboardUser);
router.get('/me', ClerkExpressRequireAuth(), getCurrentUser);

export default router;