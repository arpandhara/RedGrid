// backend/src/routes/inventoryRoutes.js
import express from 'express';
import { getInventory, updateInventory } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/hospital', protect, authorize('hospital'), getInventory);
router.put('/', protect, authorize('hospital'), updateInventory);

export default router;
