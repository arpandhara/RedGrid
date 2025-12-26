import express from 'express';
import { verifyDonation, getMyDonationStats, downloadCertificate } from '../controllers/donationController.js';
import { protect, authorize, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only Hospitals can verify donations
router.post('/verify', protect, authorize('hospital'), verifyDonation);

// Get My Stats (Donor)
router.get('/my-stats', protect, loadUser, getMyDonationStats);

// Download Certificate
router.get('/:id/certificate', protect, loadUser, downloadCertificate);

export default router;
