import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import crypto from 'crypto';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Onboard User (Deep Profile Update)
// @route   POST /api/auth/onboarding
export const onboardUser = asyncHandler(async (req, res) => {
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
       // Sanitize: Remove coordinates initially to prevent CastError if they are in invalid format
       delete updateData.location.coordinates;

       // Ensure coordinates exist and are valid numbers
       if (location.coordinates) {
         const coords = location.coordinates;
         let validCoords = null;

       // Handle { lat, lng } object from frontend
         if (typeof coords === 'object' && !Array.isArray(coords)) {
            const lng = Number(coords.lng);
            const lat = Number(coords.lat);
            if (!isNaN(lng) && !isNaN(lat)) {
               // Check if it's the default 0,0 which implies no detection
               if (lng !== 0 || lat !== 0) {
                   validCoords = [lng, lat];
               }
            }
         } 
         // Handle [lng, lat] array
         else if (Array.isArray(coords) && coords.length === 2) {
             if (coords[0] !== 0 || coords[1] !== 0) {
                validCoords = coords;
             }
         }

         if (validCoords) {
             updateData.location.coordinates = validCoords;
             updateData.location.type = 'Point';
         } 
       }
       
       // --- AUTO-GEOCODING FALLBACK (SAFE WITH TIMEOUT) ---
       // If valid coordinates were NOT found but we have address details
       if (!updateData.location.coordinates && (location.address || location.city)) {
          try {
             const addr = location.address || "";
             const city = location.city || "";
             const state = location.state || "";
             const fullAddress = `${addr}, ${city}, ${state}`.replace(/^, /, "").trim();

             if (fullAddress.length > 3) {
                 console.log(`[Onboarding] Attempting to geocode: "${fullAddress}"`);
                 
                 const fetchCoordinates = async (query) => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s Timeout
                    
                    try {
                        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
                        const res = await fetch(url, { 
                            headers: { 'User-Agent': 'BloodDonationApp/1.0' },
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (res.ok) return await res.json();
                        return [];
                    } catch (err) {
                        clearTimeout(timeoutId);
                        console.error("[Geocoding] API Request Failed:", err.message);
                        return []; // Fail gracefully, don't crash
                    }
                 };

                 let results = await fetchCoordinates(fullAddress);

                 if (!results || results.length === 0) {
                     const fallbackQuery = `${city}, ${state}`;
                     if (fallbackQuery.length > 3) {
                        results = await fetchCoordinates(fallbackQuery);
                     }
                 }

                 if (results && results.length > 0) {
                     const { lat, lon } = results[0]; 
                     if (lat && lon) {
                         updateData.location.coordinates = [parseFloat(lon), parseFloat(lat)]; 
                         updateData.location.type = "Point";
                         console.log(`[Onboarding] Geocoded to [${lon}, ${lat}]`);
                     }
                 }
             }
          } catch (geoError) {
              console.error("[Onboarding] Geocoding logic failed:", geoError.message);
              // Swallow error to ensure onboarding succeeds even if location is partial
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
      // With asyncHandler, throwing error goes to global handler
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({ success: true, data: user });
});


// @desc    Get Current User
// @route   GET /api/auth/me
export const getCurrentUser = asyncHandler(async (req, res) => {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    res.status(200).json({ success: true, data: user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Generate 6-digit OTP (Secure)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Save OTP to DB (Expires in 15 mins)
    user.resetPasswordToken = otp; 
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    // Send Email
    const emailSent = await sendVerificationEmail(user.email, otp);

    if (!emailSent) {
      res.status(500);
      throw new Error('Error sending email');
    }

    res.status(200).json({ success: true, message: 'Verification code sent to email' });
});

// @desc    Verify OTP and Update Password in Clerk
// @route   POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired code');
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
});