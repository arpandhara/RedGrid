import express from 'express';
import { verifyDonation, getMyDonationStats, downloadCertificate, redeemPoints, getLeaderboard, scheduleDonation, getOrgAppointments } from '../controllers/donationController.js';
import { protect, authorize, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only Hospitals and Donors (P2P) can verify donations
router.post('/verify', protect, authorize('hospital', 'organization', 'donor'), verifyDonation);

// Get My Stats (Donor)
router.get('/my-stats', protect, loadUser, getMyDonationStats);

// Download Certificate
router.get('/:id/certificate', protect, loadUser, downloadCertificate);

// Redeem Points
router.post('/redeem-points', protect, redeemPoints);

// Leaderboard (Public/Protected)
router.get('/leaderboard', protect, getLeaderboard);

// Schedule Donation
// Using loadUser to ensure req.user is populated (protect only gives req.auth)
router.post('/schedule', protect, loadUser, scheduleDonation);

// Get Appointments (Org)
router.get('/appointments', protect, loadUser, getOrgAppointments);

// Get My Interactions (Donor)
import { getDonorInteractions } from '../controllers/donationController.js';
router.get('/interactions', protect, loadUser, getDonorInteractions);


export default router;
