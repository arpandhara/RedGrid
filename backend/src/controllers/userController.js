import User from '../models/User.js';

// @desc    Get public profile
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-clerkId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    // Handle invalid ID format (CastError) gracefully
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update specific profile fields
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // 1. Prevent updating sensitive fields directly
    delete updates.password;
    delete updates.role;
    delete updates.email; // Usually verified emails shouldn't be changed easily
    delete updates._id;

    // 2. Find and Update
    // { new: true } returns the updated document
    const user = await User.findByIdAndUpdate(userId, updates, { 
      new: true, 
      runValidators: true 
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};