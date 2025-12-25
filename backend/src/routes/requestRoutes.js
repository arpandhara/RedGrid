// backend/src/routes/requestRoutes.js
import express from 'express';
import { createRequest } from '../controllers/requestController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js'; // Assuming these exist

const router = express.Router();

// Only Hospitals/Orgs can create requests
router.post('/', protect, authorize('hospital', 'organization'), createRequest);

export default router;