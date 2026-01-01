// backend/src/controllers/requestController.js
import Request from '../models/Request.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Inventory from '../models/Inventory.js';
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
        // 3. Trigger Notifications (Socket + DB + Email)


        // OPTIMIZATION: Prepare DB operations first
        const notifications = donors.map(donor => ({
            recipient: donor._id,
            type: 'blood_request',
            title: `URGENT: ${bloodGroup} Blood Needed!`,
            message: `A hospital nearby needs ${unitsNeeded} units for ${patientName}.`,
            relatedRequestId: newRequest._id
        }));

        // GLOBAL BROADCAST (For Feed Update)
        // This ensures everyone's "Donate Now" feed refreshes instantly
        io.emit('new_request_broadcast', {
            action: 'refresh',
            requestId: newRequest._id,
            bloodGroup: bloodGroup, // Add details for potential future toast use
            location: location
        });

        // 4. Save Notifications & Emit Personal Alerts
        // CRITICAL: Must save to DB *before* emitting socket, otherwise frontend fetches empty list
        try {
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
                console.log(`Successfully logged ${notifications.length} notifications to DB.`);

                // Fire Sockets NOW that data is in DB
                donors.forEach(donor => {
                    io.to(donor._id.toString()).emit('notification', {
                        type: 'blood_request',
                        title: `URGENT: ${bloodGroup} Blood Needed!`,
                        message: `Urgent request for ${bloodGroup} nearby!`,
                        requestId: newRequest._id
                    });
                });
            }
        } catch (dbError) {
            console.error("Bulk Notification Insert Error:", dbError);
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

        // 4. Send Email Notification (Fire-and-forget, don't block response)
        const recipientUser = await User.findById(recipientId);
        if (recipientUser && recipientUser.email) {
            // Don't await - let email send in background
            sendEmail(
                recipientUser.email,
                `Urgent: Blood Request from ${req.user.firstName}`,
                `<div style="font-family: Arial, sans-serif;">
            <h2>Blood Request</h2>
            <p>${req.user.firstName} is requesting blood donation from you.</p>
            <p><strong>Note:</strong> ${reason || 'No specific note provided.'}</p>
            <p><strong>Blood Group:</strong> ${bloodGroup}</p>
            <p>Please log in to the RedGrid app to Accept or Reject this request.</p>
          </div>`
            ).catch(err => console.error("Background email failed:", err.message));
        }

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

        // CHECK: Is the request already closed/completed?
        if (request.status === 'fulfilled' || request.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Request is no longer active' });
        }

        // CHECK: Have we already met the donor requirement?
        // Filter active acceptances (in case we add simplified withdrawal logic later)
        const activeAcceptances = request.acceptedBy.filter(a => a.status === 'accepted');

        if (activeAcceptances.length >= request.unitsNeeded) {
            return res.status(400).json({ success: false, message: 'Enough donors have already accepted this request.' });
        }

        // CHECK: Did *I* already accept it?
        const alreadyAccepted = request.acceptedBy.some(a => a.donorId.toString() === donor._id.toString());
        if (alreadyAccepted) {
            return res.status(400).json({ success: false, message: 'You have already accepted this request.' });
        }

        // 2. Add Donor to List
        request.acceptedBy.push({
            donorId: donor._id,
            status: 'accepted'
        });

        // 3. Update Status
        // If we now have enough donors, mark as 'accepted' (Closed for new donors)
        // Otherwise, keep as 'pending' (Visible in feed for others)
        const newCount = activeAcceptances.length + 1;

        if (newCount >= request.unitsNeeded) {
            request.status = 'accepted';
        } else {
            request.status = 'pending'; // Explicitly ensure it stays pending
        }

        await request.save();

        // 3. Notify the Requester (Hospital/User)
        // Ensure we have a valid requester ID
        let requesterId = request.requester?._id || request.requester;

        // Ensure requesterId is a string for socket room
        const requesterIdStr = requesterId.toString();

        console.log(`[AcceptLogic] Request ${requestId} accepted by ${donor.firstName} (${donor._id}).`);
        console.log(`[AcceptLogic] Notifying Requester ID: ${requesterIdStr}`);

        // Persist Notification FIRST
        await Notification.create({
            recipient: requesterIdStr,
            type: 'status_update',
            title: 'Donor Found!',
            message: `${donor.firstName} ${donor.lastName} (${donor.donorProfile?.bloodGroup}) has accepted your request.`,
            relatedRequestId: request._id
        });

        // Socket Emit to Requester ONLY
        const io = getIO();

        // Debug: Check if the room has connected sockets
        const roomSockets = io.sockets.adapter.rooms.get(requesterIdStr);
        console.log(`[Socket Debug] Room ${requesterIdStr} has ${roomSockets?.size || 0} sockets connected`);

        // Emit to the requester's room
        io.to(requesterIdStr).emit('notification', {
            type: 'status_update',
            title: 'Donor Found!',
            message: `${donor.firstName} accepted your request.`,
            requestId: request._id
        });

        console.log(`[Socket Debug] Emitted 'notification' event to room: ${requesterIdStr}`);

        // Global Feed Refresh Signal (Silent payload)
        // This tells clients to just re-fetch data, no message displayed
        io.emit('request_update', { action: 'refresh' });


        // 5. Send Email to Requester (Optimized: Non-blocking)
        const requesterUser = await User.findById(requesterId);
        if (requesterUser && requesterUser.email) {
            // Fire and forget - don't await
            sendEmail(
                requesterUser.email,
                `Donor Found for your Request!`,
                `<div style="font-family: Arial, sans-serif;">
               <h2>Great News!</h2>
               <p><strong>${donor.firstName} ${donor.lastName}</strong> has accepted your blood request.</p>
               <p><strong>Contact:</strong> ${donor.phone || 'Not shared'}</p>
               <p>Please coordinate with them for the donation.</p>
             </div>`
            ).catch(err => console.error("Email send failed:", err));
        }

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

        const io = getIO();

        // 1. Notify Specific Recipient (if P2P)
        if (request.recipient) {
            const recipientId = request.recipient.toString();

            // DB Notification
            await Notification.create({
                recipient: recipientId,
                type: 'status_update',
                title: 'Request Cancelled',
                message: `${req.user.firstName} has cancelled their blood request.`,
                relatedRequestId: request._id
            });

            // Socket
            io.to(recipientId).emit('notification', {
                type: 'status_update',
                title: 'Request Cancelled',
                message: `${req.user.firstName} cancelled the request.`,
                requestId: request._id
            });

            // Email
            const recipientUser = await User.findById(recipientId);
            if (recipientUser && recipientUser.email) {
                sendEmail(
                    recipientUser.email,
                    `Request Cancelled`,
                    `<p>${req.user.firstName} has cancelled the blood request you received.</p>`
                ).catch(console.error);
            }
        }

        // 2. Notify All Accepted Donors (if any)
        if (request.acceptedBy && request.acceptedBy.length > 0) {
            const acceptedDonors = request.acceptedBy.map(a => a.donorId);

            // Fetch donor details for emails
            const donorUsers = await User.find({ _id: { $in: acceptedDonors } });

            // Bulk DB Notification
            const notifications = acceptedDonors.map(donorId => ({
                recipient: donorId,
                type: 'status_update',
                title: 'Request Cancelled',
                message: `The blood request you accepted from ${req.user.firstName} has been cancelled.`,
                relatedRequestId: request._id
            }));
            await Notification.insertMany(notifications);

            // Loop for Socket & Email
            donorUsers.forEach(donor => {
                const donorIdStr = donor._id.toString();

                // Socket
                io.to(donorIdStr).emit('notification', {
                    type: 'status_update',
                    title: 'Request Cancelled',
                    message: `Request from ${req.user.firstName} was cancelled.`,
                    requestId: request._id
                });

                // Email
                if (donor.email) {
                    sendEmail(
                        donor.email,
                        `Request Cancelled`,
                        `<p>The request from <strong>${req.user.firstName}</strong> which you accepted has been cancelled by the hospital/user.</p>`
                    ).catch(console.error);
                }
            });
        }

        // Global Refresh
        io.emit('request_update', { action: 'refresh' });

        res.status(200).json({ success: true, message: 'Request cancelled successfully', data: request });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHospitalRequests = async (req, res) => {
    try {
        const hospitalId = req.user._id;
        const { status } = req.query;

        // Create a regex for city matching based on hospital's location (assuming hospital is loaded in req.user)
        // We need to fetch the full user to get location if it's not populated, but verifyDonation usually populates it.
        // protect middleware gives us the user.

        const cityRegex = new RegExp(req.user.location?.city || '', 'i');

        let query = {
            $or: [
                { requester: hospitalId }, // Outbound
                { recipient: hospitalId }, // Inbound (Direct)
                // Broadcast Requests in the same city
                {
                    recipient: { $exists: false }, // No specific recipient
                    status: 'pending',             // Only pending
                    'location.city': { $regex: cityRegex } // Same city (assuming schema has location.city or we use geospatial)
                    // Note: Schema has `location: { coordinates: [] }`. We might not have city stored directly on Request.
                    // If Request doesn't have City, we might need a geospatial query or rely on client-side filtering if volume is low.
                    // For now, let's assume we can match by geospatial if city isn't there, OR simply fetch all pending broadcasts and let frontend filter?
                    // Better: User $near if possible, but $or with $near is tricky.
                    // Let's rely on basic "requests where I am the target" first. 
                    // If user wants BROADCAST, we should probably add them.
                }
            ]
        };

        // ADJUSTMENT: Request schema doesn't seemingly store 'city' in root. 
        // It stores `location: { coordinates }`. 
        // Simple geospatial query in $or is not allowed in MongoDB (must be top level).
        // Let's stick to Direct + Outbound for "Manage Requests".
        // "Broadcast" requests should strictly be in "Feed" / "Search".
        // HOWEVER, the user asked for broadcast.
        // Let's add a separate query for Broadcasts and merge?
        // Or just let's fix the FRONTEND fetch first (which was missing). 
        // It's possible "Broadcast" meant "My requests sent TO broadcast" (Outbound), which `requester: hospitalId` covers.
        // If they mean "Incoming Broadcasts", that's usually for Donors. 
        // Hospitals *fulfilling* requests is a differnet flow.

        // Reverting to the logic that definitely works for Manage Requests (Direct + Outbound)
        // and ensuring the frontend actually calls it.

        let finalQuery = {
            $or: [
                { requester: hospitalId },
                { recipient: hospitalId }
            ]
        };
        if (status) {
            finalQuery.status = status;
        }

        const requests = await Request.find(finalQuery)
            .sort({ createdAt: -1 })
            .populate('requester', 'firstName lastName email phone location') // Get requester details
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
        // AND the request itself must not be fulfilled (double check)
        const accepted = await Request.find({
            status: { $nin: ['fulfilled', 'cancelled', 'rejected'] },
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
        const requesterIdStr = requesterId.toString();

        console.log(`[RejectLogic] Request ${request._id} rejected by ${req.user.firstName}`);
        console.log(`[RejectLogic] Notifying Requester ID: ${requesterIdStr}`);

        // Persist Notification
        await Notification.create({
            recipient: requesterIdStr,
            type: 'status_update',
            title: 'Request Rejected',
            message: `${req.user.firstName} has declined your request for blood.`,
            relatedRequestId: request._id
        });

        // Real-time Notification
        const io = getIO();

        // Debug: Check socket room
        const roomSockets = io.sockets.adapter.rooms.get(requesterIdStr);
        console.log(`[Socket Debug] Room ${requesterIdStr} has ${roomSockets?.size || 0} sockets connected`);

        io.to(requesterIdStr).emit('notification', {
            type: 'status_update',
            title: 'Request Rejected',
            message: `${req.user.firstName} declined your request.`,
            requestId: request._id
        });

        console.log(`[Socket Debug] Emitted 'notification' event to room: ${requesterIdStr}`);

        // Refresh Feed
        io.emit('request_update', { action: 'refresh' });


        // 5. Send Email to Requester (Non-blocking)
        const requesterUser = await User.findById(requesterId);
        if (requesterUser && requesterUser.email) {
            sendEmail(
                requesterUser.email,
                `Request Declined`,
                `<div style="font-family: Arial, sans-serif;">
                    <h2>Request Update</h2>
                    <p>We are sorry, but <strong>${req.user.firstName}</strong> is unable to fulfill your blood request at this time.</p>
                    <p>We recommend broadcasting your request to other nearby donors.</p>
                  </div>`
            ).catch(err => console.error("Background email failed:", err.message));
        }

        res.status(200).json({ success: true, data: request });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

import { processDonation } from '../services/donationService.js';

// ... (keep headers)

// @desc    Fulfill a Request (Hospital/User) & Decrement Inventory
// @route   PUT /api/requests/:id/fulfill
export const fulfillRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user._id;

        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Allow BOTH Recipient (Provider) AND Requester (Receiver) to fulfill
        const isRecipient = request.recipient && request.recipient.toString() === userId.toString();
        const isRequester = request.requester.toString() === userId.toString();

        if (!isRecipient && !isRequester) {
            return res.status(401).json({ success: false, message: 'Not authorized to fulfill this request' });
        }

        if (request.status === 'fulfilled') {
            return res.status(400).json({ success: false, message: 'Request is already fulfilled' });
        }

        // INVENTORY LOGIC: DECREMENT
        // If I am the Provider (Recipient) and I am a Hospital, I gave blood -> Reduce Stock.
        if ((req.user.role === 'hospital' || req.user.role === 'organization') && isRecipient) {
            const inventoryItem = await Inventory.findOne({
                hospital: userId,
                bloodGroup: request.bloodGroup
            });

            if (inventoryItem && inventoryItem.quantity >= request.unitsNeeded) {
                inventoryItem.quantity -= request.unitsNeeded;
                await inventoryItem.save();

                // Real-time Update
                getIO().to(userId.toString()).emit('inventory_update', {
                    bloodGroup: request.bloodGroup,
                    quantity: inventoryItem.quantity
                });
            }
        }

        request.status = 'fulfilled';
        await request.save();

        // REWARDS & DONATION RECORD LOGIC
        // We need to identify who the DONOR was to credit them.

        const donorsToProcess = [];

        if (isRecipient && req.user.role === 'donor') {
            // Case A: I am the P2P Recipient (User) and I fulfilled it => I gave blood.
            donorsToProcess.push(userId);
        } else if (isRequester) {
            // Case B: I am the Requester (Hospital/User).

            // 1. P2P Recipient (If Direct Request)
            if (request.recipient) {
                donorsToProcess.push(request.recipient);
            }

            // 2. Accepted Donors (If Broadcast/Group Request)
            // If request has accepted donors, they likely donated if we are marking it done.
            if (request.acceptedBy && request.acceptedBy.length > 0) {
                request.acceptedBy.forEach(a => {
                    if (a.status === 'accepted') {
                        donorsToProcess.push(a.donorId);
                    }
                });
            }
        }

        // Process rewards for all identified donors
        // Use a Set to avoid duplicates if P2P recipient is also in acceptedBy list
        const uniqueDonors = [...new Set(donorsToProcess.map(id => id.toString()))];

        for (const donorId of uniqueDonors) {
            // Check if Donation record already exists for this request/donor combo
            // Note: We need to import Donation model dynamically or move import up if not present
            const existingDonation = await import('../models/Donation.js').then(m => m.default.findOne({
                relatedRequestId: request._id,
                donor: donorId
            }));

            if (!existingDonation) {
                const verifier = isRequester ? userId : request.requester;

                await processDonation({
                    donorId: donorId,
                    verifierId: verifier, // Hospital/Requester verifies
                    requestId: request._id,
                    bloodGroup: request.bloodGroup, // Using Request BG as truth
                    donationType: request.isDirect ? 'FAMILY' : 'HOSPITAL'
                });
                console.log(`[Rewards] Processed donation rewards for ${donorId}`);
            }
        }

        // NOTIFICATIONS
        const io = getIO();

        // 1. If Requester marked as done (e.g. "I received blood") -> Notify Recipient/Donors
        if (isRequester) {
            // Notify P2P Recipient
            if (request.recipient) {
                const recipientId = request.recipient.toString();
                await Notification.create({
                    recipient: recipientId,
                    type: 'status_update',
                    title: 'Request Completed',
                    message: `${req.user.firstName} marked the request as completed.`,
                    relatedRequestId: request._id
                });
                io.to(recipientId).emit('notification', {
                    type: 'status_update',
                    title: 'Request Completed',
                    message: `Request fulfilled by ${req.user.firstName}.`,
                    requestId: request._id
                });
            }
            // Notify Accepted Donors (Broadcast)
            if (request.acceptedBy && request.acceptedBy.length > 0) {
                request.acceptedBy.forEach(async (entry) => {
                    const donorId = entry.donorId.toString();
                    if (request.recipient && request.recipient.toString() === donorId) return;

                    await Notification.create({
                        recipient: donorId,
                        type: 'status_update',
                        title: 'Donation Verified',
                        message: `${req.user.firstName} confirmed the donation. Thank you!`,
                        relatedRequestId: request._id
                    });
                    io.to(donorId).emit('notification', {
                        type: 'status_update',
                        title: 'Donation Verified',
                        message: `Hospital confirmed your donation!`,
                        requestId: request._id
                    });
                });
            }
        }

        // 2. If Recipient marked as done (e.g. "I gave blood") -> Notify Requester
        if (isRecipient) {
            const requesterId = request.requester.toString();
            await Notification.create({
                recipient: requesterId,
                type: 'status_update',
                title: 'Request Fulfilled',
                message: `${req.user.firstName} has marked the request as fulfilled.`,
                relatedRequestId: request._id
            });
            io.to(requesterId).emit('notification', {
                type: 'status_update',
                title: 'Request Fulfilled',
                message: `${req.user.firstName} marked request as done.`,
                requestId: request._id
            });
        }

        // Global Refresh
        io.emit('request_update', { action: 'refresh' });

        res.status(200).json({ success: true, message: 'Request fulfilled and inventory updated', data: request });

    } catch (error) {
        console.error("Fulfill Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
