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
      if (body.location.address) updates["location.address"] = body.location.address;
      if (body.location.city) updates["location.city"] = body.location.city;
      if (body.location.state) updates["location.state"] = body.location.state;
      if (body.location.zipCode) updates["location.zipCode"] = body.location.zipCode;
      
      // === FIX STARTS HERE ===
      // Check if coordinates exist
      if (body.location.coordinates) {
        const coords = body.location.coordinates;

        // If frontend sends { lat: 123, lng: 456 }, convert to [456, 123]
        if (typeof coords === 'object' && !Array.isArray(coords)) {
            // GeoJSON requires [Longitude, Latitude] order
            updates["location.coordinates"] = [Number(coords.lng), Number(coords.lat)];
        } 
        // If it's already an array, just assign it
        else if (Array.isArray(coords)) {
            updates["location.coordinates"] = coords;
        }
        
        // Ensure the 'type' is set for GeoJSON to work
        updates["location.type"] = "Point";
      }
      // === FIX ENDS HERE ===
    }

    // --- Donor Profile Fields ---
    if (body.donorData) {
      const d = body.donorData;
      if (d.bloodGroup) updates["donorProfile.bloodGroup"] = d.bloodGroup;
      if (d.dob) updates["donorProfile.dob"] = d.dob;
      if (d.gender) updates["donorProfile.gender"] = d.gender;
      if (d.weight) updates["donorProfile.weight"] = d.weight;
      if (d.lastDonationDate) updates["donorProfile.lastDonationDate"] = d.lastDonationDate;
      if (d.isAvailable !== undefined) updates["donorProfile.isAvailable"] = d.isAvailable;
      if (d.healthConditions) updates["donorProfile.healthConditions"] = d.healthConditions;
      if (d.medications) updates["donorProfile.medications"] = d.medications;
      if (d.hasTattooOrPiercing !== undefined) updates["donorProfile.hasTattooOrPiercing"] = d.hasTattooOrPiercing;
      if (d.hasTravelledRecently !== undefined) updates["donorProfile.hasTravelledRecently"] = d.hasTravelledRecently;
    }

    // --- Hospital Profile Fields ---
    if (body.hospitalData) {
      const h = body.hospitalData;
      if (h.hospitalName) updates["hospitalProfile.hospitalName"] = h.hospitalName;
      if (h.registrationNumber) updates["hospitalProfile.registrationNumber"] = h.registrationNumber;
      if (h.website) updates["hospitalProfile.website"] = h.website;
      if (h.bedsCount) updates["hospitalProfile.bedsCount"] = h.bedsCount;
      if (h.emergencyPhone) updates["hospitalProfile.emergencyPhone"] = h.emergencyPhone;
      if (h.type) updates["hospitalProfile.type"] = h.type;
    }

    // --- Organization Profile Fields ---
    if (body.orgData) {
      const o = body.orgData;
      if (o.organizationName) updates["orgProfile.organizationName"] = o.organizationName;
      if (o.representativeName) updates["orgProfile.representativeName"] = o.representativeName;
      if (o.licenseNumber) updates["orgProfile.licenseNumber"] = o.licenseNumber;
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