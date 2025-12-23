import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// @desc    Onboard User (Set Role & Details)
// @route   POST /api/auth/onboarding
export const onboardUser = async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk Middleware
    const { role, bloodGroup, location, organizationName } = req.body;

    //Update the user
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user doesn't exist, but for dev we can return 404
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (Expires in 15 mins)
    user.resetPasswordToken = otp; // In production, consider hashing this
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    //Send Email
    const emailSent = await sendVerificationEmail(user.email, otp);

    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Error sending email' });
    }

    res.status(200).json({ success: true, message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Verify OTP and Update Password in Clerk
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() } // Ensure not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    // Update Password in Clerk
    // This updates the user's password securely in Clerk's database
    await clerkClient.users.updateUser(user.clerkId, {
      password: newPassword
    });

    // 3. Clear OTP fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    // Handle specific Clerk password errors
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    res.status(500).json({ success: false, message: errorMessage });
  }
};