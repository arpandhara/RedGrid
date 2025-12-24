import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js'; // Ensures user is logged in
import { getUserById, updateProfile } from '../controllers/userController.js'; // Imports logic

const router = express.Router();

// 1. GET User by ID (Public or Internal use)
router.get('/:id', getUserById);

// 2. UPDATE User Profile (Protected)
// Use requireAuth to make sure only logged-in users can hit this
router.put('/profile', requireAuth, updateProfile); 

export default router;