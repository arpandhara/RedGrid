// backend/src/controllers/inventoryController.js
import Inventory from '../models/Inventory.js';
import { getIO } from '../utils/socket.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get Inventory by Hospital
// @route   GET /api/inventory/hospital
export const getInventory = asyncHandler(async (req, res) => {
    const inventory = await Inventory.find({ hospital: req.user._id });
    res.status(200).json({ success: true, data: inventory });
});

// @desc    Update Inventory Item
// @route   PUT /api/inventory
export const updateInventory = asyncHandler(async (req, res) => {
    const { bloodGroup, quantity, type } = req.body; // type = 'add' or 'remove'
    const hospitalId = req.user._id;

    let item = await Inventory.findOne({ hospital: hospitalId, bloodGroup });

    if (!item) {
        if (type === 'remove') {
            res.status(400);
            throw new Error('Blood group not found');
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

    // Emit Real-time Update
    const io = getIO();
    io.to(hospitalId.toString()).emit('inventory_update', {
        bloodGroup: item.bloodGroup,
        quantity: item.quantity
    });

    res.status(200).json({ success: true, data: item });
});
