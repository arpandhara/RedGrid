import User from '../models/User.js';

export const requireOnboarding = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    
    // Fetch only the isOnboarded flag for performance
    const user = await User.findOne({ clerkId: userId }).select('isOnboarded');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isOnboarded) {
      return res.status(403).json({ 
        success: false, 
        error_code: 'ONBOARDING_REQUIRED',
        message: 'Please complete your profile to perform this action.' 
      });
    }

    next();
  } catch (error) {
    console.error("Onboarding Check Error:", error);
    res.status(500).json({ success: false, message: 'Server Error during check' });
  }
};