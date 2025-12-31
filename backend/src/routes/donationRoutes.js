import express from 'express';
import { verifyDonation, getMyDonationStats, downloadCertificate, redeemPoints, getLeaderboard } from '../controllers/donationController.js';
import { protect, authorize, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only Hospitals and Donors (P2P) can verify donations
router.post('/verify', protect, authorize('hospital', 'donor'), verifyDonation);

// Get My Stats (Donor)
router.get('/my-stats', protect, loadUser, getMyDonationStats);

// Download Certificate
router.get('/:id/certificate', protect, loadUser, downloadCertificate);

// Redeem Points
router.post('/redeem-points', protect, redeemPoints);

// Leaderboard (Public/Protected)
router.get('/leaderboard', protect, getLeaderboard);

export default router;
