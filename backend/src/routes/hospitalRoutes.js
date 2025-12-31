import express from 'express';
import { getDashboardStats, getInventory, updateInventory } from '../controllers/hospitalController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware for all hospital routes
router.use(protect);
router.use(authorize('hospital'));

router.get('/stats', getDashboardStats);
router.get('/inventory', getInventory);
router.put('/inventory', updateInventory);

export default router;