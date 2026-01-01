// backend/src/routes/requestRoutes.js
import express from 'express';
import { createRequest, acceptRequest, getHospitalRequests, cancelRequest, createDirectRequest, getActiveRequests, getUserRequests, rejectRequest, fulfillRequest } from '../controllers/requestController.js';
import { protect, authorize, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only Hospitals/Orgs AND Donors (Broadcast) can create requests
router.post('/', protect, authorize('hospital', 'organization', 'donor'), createRequest);

// Direct P2P Request
router.post('/direct', protect, loadUser, createDirectRequest);

// Get Active Requests Feed (For Donors)
router.get('/feed', protect, loadUser, getActiveRequests); // New

// Get Hospital Requests
router.get('/hospital', protect, authorize('hospital', 'organization'), getHospitalRequests);

// Get User Specific Requests (Incoming P2P / Outgoing)
router.get('/user', protect, loadUser, getUserRequests);

// Cancel Request
router.put('/:id/cancel', protect, authorize('hospital', 'organization'), cancelRequest);

// Reject Request
router.put('/:id/reject', protect, loadUser, rejectRequest);

// Donors can accept requests
router.put('/:id/accept', protect, loadUser, acceptRequest);

// Fulfill Request (Hospital marks done + inventory decrement)
router.put('/:id/fulfill', protect, authorize('hospital', 'organization'), fulfillRequest);

export default router;