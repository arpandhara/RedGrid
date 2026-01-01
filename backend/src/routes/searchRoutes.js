import express from 'express';
import { searchAvailability, searchCenters } from '../controllers/searchController.js';
import { protect, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 1. protect verify token
// 2. loadUser gets the full Mongo User object (needed for excluding self)
router.get('/availability', protect, loadUser, searchAvailability);
router.get('/centers', protect, searchCenters);

export default router;
