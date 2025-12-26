import User from '../models/User.js';
import Request from '../models/Request.js'; // New Import
import Inventory from '../models/Inventory.js';

// @desc    Search for Blood Availability (Donors + Hospitals)
// @route   GET /api/search/availability
export const searchAvailability = async (req, res) => {
    try {
        const { city, bloodGroup } = req.query;

        if (!city) {
            return res.status(400).json({ success: false, message: 'City is required' });
        }

        // 1. Search Hospitals with Inventory
        // First find hospitals in the city
        const hospitalsInCity = await User.find({
            role: 'hospital',
            $or: [
                { 'location.city': { $regex: new RegExp(city, 'i') } },

                { 'location.address': { $regex: new RegExp(city, 'i') } },
                { 'location.state': { $regex: new RegExp(city, 'i') } }
            ]
        });
        
        console.log(`[Search] Hospitals Found: ${hospitalsInCity.length}`);
        
        const hospitalIds = hospitalsInCity.map(h => h._id);

        // Find inventory matching blood group for those hospitals
        const inventoryQuery = {
            hospital: { $in: hospitalIds },
            quantity: { $gt: 0 }
        };
        
        if (bloodGroup) {
            inventoryQuery.bloodGroup = bloodGroup;
        }

        const hospitalInventory = await Inventory.find(inventoryQuery).populate('hospital', 'hospitalProfile location email phone');



        // 2. Search Donors
        console.log(`Searching Donors: Group=${bloodGroup}, City=${city}`);
        
        const donorQuery = {
            role: 'donor',
            _id: { $ne: req.user._id }, // Exclude self
            'donorProfile.isAvailable': true,
            $or: [
                { 'location.city': { $regex: new RegExp(city, 'i') } },
                { 'location.address': { $regex: new RegExp(city, 'i') } },
                { 'location.state': { $regex: new RegExp(city, 'i') } }
            ]
        };

        if (bloodGroup) {
            donorQuery['donorProfile.bloodGroup'] = bloodGroup;
        }
        
        const donorResultsRaw = await User.find(donorQuery).select('firstName lastName location donorProfile.lastDonationDate phone email donorProfile.bloodGroup');

        // Check for existing pending requests from this user to the found donors and hospitals
        // This avoids N+1 queries by fetching all relevant requests in one go
        const donorIds = donorResultsRaw.map(d => d._id);
        // hospitalIds is already defined from the hospital search
        const allTargetIds = [...donorIds, ...hospitalIds];

        const existingRequests = await Request.find({
            requester: req.user._id,
            recipient: { $in: allTargetIds },
            status: 'pending'
        }).select('recipient');

        const requestedSet = new Set(existingRequests.map(r => r.recipient.toString()));

        // Format Results
        const hospitalResults = hospitalInventory.map(inv => ({
            type: 'hospital',
            _id: inv.hospital._id,
            name: inv.hospital.hospitalProfile?.hospitalName,
            location: inv.hospital.location,
            bloodGroup: inv.bloodGroup,
            units: inv.quantity,
            verified: true, // Hospitals are trusted
            lastUpdated: inv.lastUpdated,
            hasRequested: requestedSet.has(inv.hospital._id.toString()) // New Flag
        }));

        const donorResults = donorResultsRaw.map(d => ({
            type: 'donor',
            _id: d._id,
            name: `${d.firstName} ${d.lastName}`,
            location: d.location,
            bloodGroup: d.donorProfile?.bloodGroup, // Use donor's actual blood group
            units: 1, // Donors usually give 1 unit
            verified: d.isVerified || false, 
            lastDonation: d.donorProfile?.lastDonationDate,
            hasRequested: requestedSet.has(d._id.toString()) // New Flag
        }));

        console.log(`[Search] Donors Found: ${donorResults.length}`);
        
        if (donorResults.length === 0) {
            console.log(`[Search Debug] No donors found for query:`, JSON.stringify(donorQuery, null, 2));
        }

        // Combine
        const results = [...hospitalResults, ...donorResults];

        res.status(200).json({ success: true, count: results.length, data: results });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
