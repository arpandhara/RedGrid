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

      // AUTO-GEOCODING
      // If address details are provided but coordinates are NOT specifically provided, try to geocode.
      if (!body.location.coordinates && (body.location.address || body.location.city)) {
          // RESET coordinates to avoid "ghost location" if geocoding fails.
          updates["location.coordinates"] = [];
          
          try {
             // Construct address string
             const addr = body.location.address || "";
             const city = body.location.city || "";
             const state = body.location.state || "";
             const fullAddress = `${addr}, ${city}, ${state}`.replace(/^, /, "").trim();

             if (fullAddress.length > 3) {
                 console.log(`Attempting to geocode: "${fullAddress}"`);
                 
                 // HEPLER FUNCTION FOR GEOCODING
                 const fetchCoordinates = async (query) => {
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
                    const res = await fetch(url, { headers: { 'User-Agent': 'BloodDonationApp/1.0' } });
                    if (res.ok) {
                        return await res.json();
                    }
                    return [];
                 };

                 // 1. Try Full Address
                 let results = await fetchCoordinates(fullAddress);

                 // 2. Fallback: Try City + State if specific address fails
                 if (!results || results.length === 0) {
                     console.log("Full address failed, retrying with City/State...");
                     const fallbackQuery = `${city}, ${state}`;
                     if (fallbackQuery.length > 3) {
                        results = await fetchCoordinates(fallbackQuery);
                     }
                 }

                 console.log("Geocoder Final Results:", JSON.stringify(results?.[0]?.place_id || 'No results'));

                 if (results && results.length > 0) {
                     const { lat, lon } = results[0]; 
                     if (lat && lon) {
                         updates["location.coordinates"] = [parseFloat(lon), parseFloat(lat)]; 
                         updates["location.type"] = "Point";
                         console.log(`Geocoded to [${lon}, ${lat}]`);
                     }
                 } else {
                     console.log("Geocoder returned 0 results.");
                 }
             }
          } catch (geoError) {
              console.error("Geocoding failed:", geoError.message);
          }
      }

      if (body.location.coordinates) {
        const coords = body.location.coordinates;

        if (typeof coords === 'object' && !Array.isArray(coords)) {
            updates["location.coordinates"] = [Number(coords.lng), Number(coords.lat)];
        } 
        // If it's already an array, just assign it
        else if (Array.isArray(coords)) {
            updates["location.coordinates"] = coords;
        }
        
        // Ensure the 'type' is set for GeoJSON to work
        updates["location.type"] = "Point";
      }
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