import User from '../models/User.js';

// @desc    Onboard User (Set Role & Details)
// @route   POST /api/auth/onboarding
export const onboardUser = async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk Middleware
    const { role, bloodGroup, location, organizationName } = req.body;

    // Logic: Update the user
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        role,
        bloodGroup: role === 'donor' ? bloodGroup : null,
        organizationName: (role !== 'donor') ? organizationName : null,
        location,
        isOnboarded: true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};