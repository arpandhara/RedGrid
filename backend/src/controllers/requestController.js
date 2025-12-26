// backend/src/controllers/requestController.js
import Request from '../models/Request.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getIO } from '../utils/socket.js'; 
import { sendEmail } from '../utils/emailService.js'; 

// @desc    Create a Blood Request & Notify Nearby Donors
// @route   POST /api/requests
export const createRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, unitsNeeded, urgency, location } = req.body;
    const requesterId = req.user._id;

    console.log("Creating request for:", { bloodGroup, location });

    // Create the Request
    const newRequest = await Request.create({
      requester: requesterId,
      patientName,
      bloodGroup,
      unitsNeeded,
      urgency,
      location // Expecting { type: 'Point', coordinates: [lng, lat] }
    });

    // Geospatial Query: Find Donors within 10km (10000 meters)
    const donors = await User.find({
      role: 'donor',
      'donorProfile.bloodGroup': bloodGroup, // Strict matching
      'donorProfile.isAvailable': true,
      location: {
        $near: {
          $geometry: {
             type: "Point",
             coordinates: location.coordinates
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    console.log(`Found ${donors.length} eligible donors nearby.`);
    donors.forEach(d => {
        console.log(`- Donor: ${d.firstName} (${d.email})`);
        console.log(`  Location: ${JSON.stringify(d.location)}`);
    });

    // 3. Trigger Notifications (Socket + DB + Email)
    const io = getIO();
    
    // Process async notifications properly
    for (const donor of donors) {
      // A. Save to DB
      try {
        await Notification.create({
          recipient: donor._id,
          type: 'blood_request',
          title: `URGENT: ${bloodGroup} Blood Needed!`,
          message: `A hospital nearby needs ${unitsNeeded} units for ${patientName}.`,
          relatedRequestId: newRequest._id
        });

        // Emit Real-time Socket Event
        io.to(donor._id.toString()).emit('notification', {
          type: 'blood_request',
          message: `Urgent request for ${bloodGroup} nearby!`,
          requestId: newRequest._id
        });
        
        console.log(`Notified donor: ${donor.firstName} (${donor._id})`);

      } catch (notifyError) {
        console.error(`Failed to notify donor ${donor._id}:`, notifyError);
      }
      
      // C. Send Email (Optional - can be queued)
      // sendEmail(donor.email, ...);
    }

    res.status(201).json({
      success: true,
      message: `Request created. ${donors.length} donors notified.`,
      data: newRequest
    });

  } catch (error) {
    console.error("Create Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Direct P2P Request (User to User/Hospital)
// @route   POST /api/requests/direct
export const createDirectRequest = async (req, res) => {
  try {
    const { recipientId, recipientType, reason, patientDetails, bloodGroup } = req.body;
    const requesterId = req.user._id;

    console.log(`Direct Request from ${requesterId} to ${recipientId} (${recipientType})`);

    // 1. Create Request Record (Marked as Direct)
    const newRequest = await Request.create({
      requester: requesterId,
      recipient: recipientId, // Ensure Schema has this or use flexible schema
      isDirect: true,         // Need to ensure Schema supports this flag
      patientName: patientDetails?.name || 'Self',
      bloodGroup: bloodGroup,
      unitsNeeded: 1,
      urgency: 'critical', // Fixed from 'high' to match enum ['critical', 'moderate', 'low']
      location: req.user.location || { type: 'Point', coordinates: [0, 0] },
      status: 'pending',
      note: reason
    });

    // 2. Notify Recipient
    await Notification.create({
      recipient: recipientId,
      type: 'direct_request',
      title: `Blood Request: ${req.user.firstName} needs help!`,
      message: reason || `Use says they need ${bloodGroup} blood.`,
      relatedRequestId: newRequest._id,
      actionUrl: `/requests/${newRequest._id}`
    });

    // 3. Socket Event
    const io = getIO();
    io.to(recipientId.toString()).emit('notification', {
      type: 'direct_request',
      title: `New Direct Request`,
      message: `${req.user.firstName} sent you a request.`,
      requestId: newRequest._id
    });

    res.status(201).json({ success: true, message: 'Request sent successfully', data: newRequest });

  } catch (error) {
    console.error("Direct Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept a Blood Request (Donor)
// @route   PUT /api/requests/:id/accept
export const acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const donor = req.user;

    // 1. Find the request
    const request = await Request.findById(requestId).populate('requester');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request is no longer active' });
    }

    // 2. Update Request
    // 4. Update request status
    // Changed: Status becomes 'accepted', not 'fulfilled' immediately.
    // It becomes 'fulfilled' only after physical verification (QR Scan).
    request.status = 'accepted';
    
    request.acceptedBy.push({
      donorId: donor._id,
      status: 'accepted'
    });
    // For now, we auto-close the request upon first acceptance as per "Live Donation Loop" Phase 1
    // In future, we can check unitsNeeded vs accepted count
    // request.status = 'fulfilled'; // This line is commented out as per the change
    await request.save();

    // 3. Notify the Requester (Hospital/User)
    // Ensure we have a valid requester ID
    let requesterId = request.requester?._id || request.requester;
    if (typeof requesterId === 'object') requesterId = requesterId.toString();

    console.log(`[AcceptLogic] Request ${requestId} accepted by ${donor.firstName} (${donor._id}).`);
    console.log(`[AcceptLogic] Notifying Requester ID: ${requesterId}`);

    // Persist Notification
    await Notification.create({
      recipient: requesterId,
      type: 'status_update',
      title: 'Donor Found!',
      message: `${donor.firstName} ${donor.lastName} (${donor.donorProfile?.bloodGroup}) has accepted your request.`,
      relatedRequestId: request._id
    });

    // Socket Emit to Requester ONLY
    const io = getIO();
    
    // Explicitly check we are not broadcasting
    io.to(requesterId).emit('notification', {
      type: 'status_update',
      title: 'Donor Found!',
      message: `${donor.firstName} accepted your request.`,
      requestId: request._id
    });

    // Global Feed Refresh Signal (Silent payload)
    // This tells clients to just re-fetch data, no message displayed
    io.emit('request_update', { action: 'refresh' });

    res.status(200).json({
      success: true,
      message: 'Thank you! The hospital has been notified.',
      data: request
    });

  } catch (error) {
    console.error('Accept Request Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Cancel a Request
// @route   PUT /api/requests/:id/cancel
export const cancelRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const hospitalId = req.user._id;

        const request = await Request.findOne({ _id: requestId, requester: hospitalId });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found or unauthorized' });
        }

        if (request.status === 'fulfilled' || request.status === 'cancelled') {
             return res.status(400).json({ success: false, message: `Cannot cancel a ${request.status} request` });
        }

        request.status = 'cancelled';
        await request.save();

        res.status(200).json({ success: true, message: 'Request cancelled successfully', data: request });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHospitalRequests = async (req, res) => {
    try {
        const hospitalId = req.user._id;
        const { status } = req.query;

        let query = { requester: hospitalId };
        if (status) {
            query.status = status;
        }

        const requests = await Request.find(query)
            .sort({ createdAt: -1 })
            .populate('acceptedBy.donorId', 'firstName lastName donorProfile.bloodGroup phone'); // Get donor details

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Active Requests (For Feed)
// @route   GET /api/requests/feed
// @desc    Get All Active Requests (For Feed) - Geo-filtered
// @route   GET /api/requests/feed
export const getActiveRequests = async (req, res) => {
    try {
        const { lat, lng, radius = 50, city } = req.query; // Radius in km
        
        let query = { 
            status: { $in: ['pending', 'urgent'] },
            isDirect: { $ne: true }, // Exclude Direct/P2P Requests
            requester: { $ne: req.user._id } // Exclude my own requests
        };

        // 1. Geospatial Filter (Priority)
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            };
        } 
        // 2. City Filter (Fallback)
        else if (city) {
            // This requires the Request model to have a city field or we query populated fields (harder in simple find)
            // Ideally, we should filter by the user's registered city if no coords provided
             // For now, let's assume we filter in memory if we can't do geo, OR rely on the requester's populated location
        }
        // 3. Authenticated User Location Fallback
        else if (req.user?.location?.coordinates?.length === 2 && req.user.location.coordinates[0] !== 0) {
             query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: req.user.location.coordinates
                    },
                    $maxDistance: 50000 // Default 50km for user's home location
                }
            };
        }

        const requests = await Request.find(query)
            .populate('requester', 'firstName lastName hospitalProfile orgProfile location')
            .sort({ createdAt: -1 });

        // Secondary In-Memory City Filter (if Geo failed/wasn't used but City param exists)
        // This handles cases where Request schema might not store city directly but location { address, city ... }
        const finalRequests = city && !query.location
            ? requests.filter(r => r.requester?.location?.city?.toLowerCase().includes(city.toLowerCase()))
            : requests;

        res.status(200).json({ success: true, count: finalRequests.length, data: finalRequests });
    } catch (error) {
        console.error("Feed Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Helper endpoints for "My Requests" tab
// @route   GET /api/requests/user
export const getUserRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // 1. Incoming P2P Requests
        const incoming = await Request.find({ 
            recipient: userId, 
            status: 'pending' 
        }).populate('requester', 'firstName lastName hospitalProfile orgProfile location');

        // 2. Outgoing Requests (Broadcasts + Direct)
        const outgoing = await Request.find({ 
            requester: userId 
        }).sort({ createdAt: -1 });

        // 3. Accepted Requests (Tickets)
        // Filter: Must be in 'acceptedBy' list AND status within that list must be 'accepted' (not completed/no-show)
        const accepted = await Request.find({
            acceptedBy: { 
                $elemMatch: { 
                    donorId: userId, 
                    status: 'accepted' 
                } 
            }
        })
        .populate('requester', 'firstName lastName hospitalProfile orgProfile location')
        .sort({ updatedAt: -1 }); // Latest tickets first

        res.status(200).json({ 
            success: true, 
            data: { incoming, outgoing, accepted } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject a P2P request
// @route   PUT /api/requests/:id/reject
export const rejectRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Safety check: Cannot reject a request with no recipient (Broadcast)
        if (!request.recipient) {
             return res.status(400).json({ success: false, message: 'Cannot reject a broadcast request' });
        }

        // Only the recipient can reject
        if (request.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to reject this request' });
        }

        request.status = 'rejected'; 
        await request.save();

        // Notify the Requester (The person who asked for help)
        const requesterId = request.requester; // ID of the user who sent the request

        // Persist Notification
        await Notification.create({
            recipient: requesterId,
            type: 'status_update',
            title: 'Request Rejected',
            message: `${req.user.firstName} has declined your request for blood.`,
            relatedRequestId: request._id
        });

        // Real-time Notification
        const io = getIO();
        io.to(requesterId.toString()).emit('notification', {
            type: 'status_update',
            title: 'Request Rejected',
            message: `${req.user.firstName} declined your request.`,
            requestId: request._id
        });

        // Refresh Feed
        io.emit('request_update', { action: 'refresh' });

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
