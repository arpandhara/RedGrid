import User from '../models/User.js';

// @desc    Get public profile of a user (e.g., Hospital viewing Donor)
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-clerkId'); // Hide sensitive data
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update specific profile fields (e.g., Avatar, Bio)
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth; 
    const updates = req.body; // In real app, whitelist allowed fields here

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updates },
      { new: true }
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};