// backend/src/controllers/donorController.js
import User from '../models/User.js';

// @desc    Get Donor Profile
// @route   GET /api/donors/profile
export const getDonorProfile = async (req, res) => {
    try {
        const donor = await User.findById(req.user._id).select('-password');
        if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });
        
        res.status(200).json({ success: true, data: donor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};