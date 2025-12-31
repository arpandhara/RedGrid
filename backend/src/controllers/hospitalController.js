import Inventory from '../models/Inventory.js';
import Request from '../models/Request.js';
import Donation from '../models/Donation.js';

// @desc    Get Hospital Dashboard Stats
// @route   GET /api/hospital/stats
export const getDashboardStats = async (req, res) => {
  try {
    const hospitalId = req.user._id;

    // 1. Total Blood Units in Inventory
    const inventory = await Inventory.find({ hospital: hospitalId });
    const totalUnits = inventory.reduce((acc, item) => acc + item.quantity, 0);

    // 2. Active Requests (Pending)
    const activeRequests = await Request.countDocuments({ 
        requester: hospitalId, 
        status: 'pending' 
    });

    // 3. Total Donors Visited (Completed Donations)
    const totalDonations = await Donation.countDocuments({ 
        hospital: hospitalId 
    });

    // 4. Pending Requests (same as active for now, or could split by urgency)
    // Let's use 'Critical' requests for the 4th stat
    const criticalRequests = await Request.countDocuments({
        requester: hospitalId,
        status: 'pending',
        urgency: 'critical'
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnits,
        activeRequests,
        totalDonations,
        criticalRequests
      }
    });

  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Inventory
// @route   GET /api/hospital/inventory
export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({ hospital: req.user._id });
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Inventory (Add/Remove)
// @route   PUT /api/hospital/inventory
export const updateInventory = async (req, res) => {
    try {
        const { bloodGroup, quantity, type } = req.body; // type = 'add' or 'remove'
        const hospitalId = req.user._id;

        let item = await Inventory.findOne({ hospital: hospitalId, bloodGroup });

        if (!item) {
            // Create if doesn't exist (only valid for 'add')
            if (type === 'remove') {
                return res.status(400).json({ success: false, message: 'Blood group not found in inventory' });
            }
            item = new Inventory({ hospital: hospitalId, bloodGroup, quantity: 0 });
        }

        if (type === 'add') {
            item.quantity += Number(quantity);
        } else if (type === 'remove') {
            item.quantity = Math.max(0, item.quantity - Number(quantity));
        }

        item.lastUpdated = Date.now();
        await item.save();

        res.status(200).json({ success: true, data: item, message: 'Inventory updated' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};