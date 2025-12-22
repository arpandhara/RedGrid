import express from 'express';
import { clerkWebhook } from '../controllers/authController.js';

const router = express.Router();

// Logic is in the controller
router.post('/clerk', clerkWebhook);

export default router;