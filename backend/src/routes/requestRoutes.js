// backend/src/routes/requestRoutes.js
import express from 'express';
import { createRequest, acceptRequest, getHospitalRequests, cancelRequest, createDirectRequest, getActiveRequests, getUserRequests, rejectRequest, fulfillRequest } from '../controllers/requestController.js';
import { protect, authorize, loadUser } from '../middlewares/authMiddleware.js';

import validateResource from '../middlewares/validateResource.js';
import { createRequestSchema, createDirectRequestSchema, acceptRequestSchema } from '../utils/schemas/request.schema.js';

const router = express.Router();

// Only Hospitals/Orgs AND Donors (Broadcast) can create requests
router.post(
    '/',
    protect,
    authorize('hospital', 'organization', 'donor'),
    validateResource(createRequestSchema),
    createRequest
);

// Direct P2P Request
router.post(
    '/direct',
    protect,
    loadUser,
    validateResource(createDirectRequestSchema),
    createDirectRequest
);


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
router.put('/:id/accept', protect, loadUser, validateResource(acceptRequestSchema), acceptRequest);


// Fulfill Request (Hospital marks done + inventory decrement)
router.put('/:id/fulfill', protect, authorize('hospital', 'organization'), fulfillRequest);

export default router;