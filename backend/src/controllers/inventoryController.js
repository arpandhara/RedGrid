// backend/src/controllers/inventoryController.js
import Inventory from '../models/Inventory.js';

// @desc    Get Inventory by Hospital
// @route   GET /api/inventory/hospital
export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({ hospital: req.user._id });
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Inventory Item
// @route   PUT /api/inventory
export const updateInventory = async (req, res) => {
    try {
        const { bloodGroup, quantity, type } = req.body; // type = 'add' or 'remove'
        const hospitalId = req.user._id;

        let item = await Inventory.findOne({ hospital: hospitalId, bloodGroup });

        if (!item) {
            if (type === 'remove') {
                return res.status(400).json({ success: false, message: 'Blood group not found' });
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

        res.status(200).json({ success: true, data: item });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
