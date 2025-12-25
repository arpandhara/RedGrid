import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// @desc    Onboard User (Deep Profile Update)
// @route   POST /api/auth/onboarding
export const onboardUser = async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk Middleware
  
    const { 
      role, 
      firstName, 
      lastName, 
      phone, 
      location, 
      donorData,
      hospitalData,
      orgData 
    } = req.body;

    // Prepare the base update object
    let updateData = {
      role,
      firstName,
      lastName,
      phone,
      isOnboarded: true
    };

    // === FIX: Handle Location Transformation (GeoJSON) ===
    if (location) {
       updateData.location = { ...location };

       // Ensure coordinates exist and are valid numbers
       if (location.coordinates) {
         const coords = location.coordinates;
         let validCoords = null;

         // Handle { lat, lng } object from frontend
         if (typeof coords === 'object' && !Array.isArray(coords)) {
            const lng = Number(coords.lng);
            const lat = Number(coords.lat);
            if (!isNaN(lng) && !isNaN(lat)) {
               validCoords = [lng, lat];
            }
         } 
         // Handle [lng, lat] array
         else if (Array.isArray(coords) && coords.length === 2) {
             validCoords = coords;
         }

         if (validCoords) {
             updateData.location.coordinates = validCoords;
             updateData.location.type = 'Point';
         } else {
             // If coordinates are invalid, DO NOT set location to avoid breaking index
             delete updateData.location; 
         }
       }
    }
    // ====================================================

    // Attach Role-Specific Data to the correct Sub-Schema
    if (role === 'donor' && donorData) {
      updateData.donorProfile = donorData;
    } 
    else if (role === 'hospital' && hospitalData) {
      updateData.hospitalProfile = hospitalData;
    } 
    else if (role === 'organization' && orgData) {
      //TIME BOMB LOGIC
      let expiresAt = null;
      if (orgData.accountType === 'temporary' && orgData.expiryDate) {
        expiresAt = new Date(orgData.expiryDate);
      }

      updateData.orgProfile = {
        ...orgData,
        accountExpiresAt: expiresAt
      };
    }

    // Update the User in MongoDB
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      updateData,
      { new: true, runValidators: true } // runValidators ensures schemas are respected
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });

  } catch (error) {
    console.error("Onboarding Error:", error);
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
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (Expires in 15 mins)
    user.resetPasswordToken = otp; 
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    // Send Email
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
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    // Update Password in Clerk
    await clerkClient.users.updateUser(user.clerkId, {
      password: newPassword
    });

    // Clear OTP fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    res.status(500).json({ success: false, message: errorMessage });
  }
};