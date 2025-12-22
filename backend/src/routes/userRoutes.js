import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getUserById, updateProfile } from '../controllers/userController.js';

const router = express.Router();

// Public or Protected routes for User Management
router.get('/:id', getUserById);           // Anyone can view a profile (maybe?)
router.put('/profile', requireAuth, updateProfile); // Only owner can update

export default router;