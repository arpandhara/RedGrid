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
    const requesterId = req.auth.userId; // From Auth Middleware

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

    // 3. Trigger Notifications (Socket + DB + Email)
    const io = getIO();
    
    // Process async notifications
    donors.forEach(async (donor) => {
      // A. Save to DB
      await Notification.create({
        recipient: donor._id,
        type: 'blood_request',
        title: `URGENT: ${bloodGroup} Blood Needed!`,
        message: `A hospital nearby needs ${unitsNeeded} units for ${patientName}.`,
        relatedRequestId: newRequest._id
      });

      // Emit Real-time Socket Event
      // We assume users join a room named by their User ID upon connection
      io.to(donor._id.toString()).emit('notification', {
        type: 'blood_request',
        message: `Urgent request for ${bloodGroup} nearby!`,
        requestId: newRequest._id
      });

      // C. Send Email (Optional - can be queued)
      // sendEmail(donor.email, ...);
    });

    res.status(201).json({
      success: true,
      message: `Request created. ${donors.length} donors notified.`,
      data: newRequest
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};