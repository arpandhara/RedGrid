import User from '../models/User.js';

// @desc    Onboard a new user (save role & details)
// @route   POST /api/user/onboarding
// @access  Private
export const onboardUser = async (req, res) => {
  try {
    const { userId } = req.auth; 
    const { role, bloodGroup, location, organizationName } = req.body;

    if (role === 'user' && !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required for donors.' });
    }
    if (role === 'organization' && !organizationName) {
      return res.status(400).json({ success: false, message: 'Organization name is required.' });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        role,
        // If switching to organization, clear blood group
        bloodGroup: role === 'organization' ? null : bloodGroup, 
        location,
        organizationName: role === 'organization' ? organizationName : null,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    res.status(200).json({ success: true, data: user });

  } catch (error) {
    console.error('Onboarding Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/user/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get User Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};