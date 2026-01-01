import User from '../models/User.js';


// @desc    Get public profile
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-clerkId -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


import { geocodeAddress } from '../services/geocodingService.js';

// @desc    Update authenticated user's full profile
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const body = req.body;
    const updates = {};

    // --- Common Fields ---
    if (body.firstName) updates.firstName = body.firstName;
    if (body.lastName) updates.lastName = body.lastName;
    if (body.phone) updates.phone = body.phone;

    // --- Location (Nested) ---
    if (body.location) {
      const { address, city, state, zipCode, coordinates } = body.location;

      if (address) updates["location.address"] = address;
      if (city) updates["location.city"] = city;
      if (state) updates["location.state"] = state;
      if (zipCode) updates["location.zipCode"] = zipCode;

      // 1. Explicit Coordinates Provided
      if (coordinates) {
        if (Array.isArray(coordinates)) {
          updates["location.coordinates"] = coordinates;
        } else if (typeof coordinates === 'object') {
          updates["location.coordinates"] = [Number(coordinates.lng), Number(coordinates.lat)];
        }
        updates["location.type"] = "Point";
      }
      // 2. Auto-Geocoding (If specific address/city provided but NO coordinates)
      else if (address || city) {
        updates["location.coordinates"] = []; // Reset to avoid ghost location

        const fullAddress = `${address || ""}, ${city || ""}, ${state || ""}`.replace(/^, /, "").trim();

        if (fullAddress.length > 3) {
          const geoResult = await geocodeAddress(fullAddress);
          if (geoResult) {
            updates["location.coordinates"] = geoResult;
            updates["location.type"] = "Point";
          } else {
            // Fallback: Try City + State
            const fallbackQuery = `${city || ""}, ${state || ""}`;
            const fallbackResult = await geocodeAddress(fallbackQuery);
            if (fallbackResult) {
              updates["location.coordinates"] = fallbackResult;
              updates["location.type"] = "Point";
            }
          }
        }
      }
    }

    // --- Donor Profile Fields ---
    if (body.donorData) {
      Object.keys(body.donorData).forEach(key => {
        if (body.donorData[key] !== undefined) {
          updates[`donorProfile.${key}`] = body.donorData[key];
        }
      });
    }

    // --- Hospital Profile Fields ---
    if (body.hospitalData) {
      Object.keys(body.hospitalData).forEach(key => {
        if (body.hospitalData[key] !== undefined) {
          updates[`hospitalProfile.${key}`] = body.hospitalData[key];
        }
      });
    }

    // --- Organization Profile Fields ---
    if (body.orgData) {
      // Convert expiryDate to db field 'accountExpiresAt'
      if (body.orgData.expiryDate) {
        updates["orgProfile.accountExpiresAt"] = body.orgData.expiryDate;
        delete body.orgData.expiryDate;
      }

      Object.keys(body.orgData).forEach(key => {
        if (body.orgData[key] !== undefined) {
          updates[`orgProfile.${key}`] = body.orgData[key];
        }
      });
    }

    // 2. Perform Update
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-clerkId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
