// backend/src/routes/donorRoutes.js
import express from 'express';
import { getDonorProfile } from '../controllers/donorController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, authorize('donor'), getDonorProfile);

export default router;
