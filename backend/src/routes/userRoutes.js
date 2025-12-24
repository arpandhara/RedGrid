import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getUserById, updateProfile } from '../controllers/userController.js';

const router = express.Router();

// Public or Protected routes for User Management
router.get('/:id', getUserById);
router.put('/profile', requireAuth, updateProfile); 
router.put('/profile', protect, userController.updateProfile);

export default router;