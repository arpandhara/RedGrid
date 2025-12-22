import User from '../models/User.js';

// @desc    Get public profile
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-clerkId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    // Handle invalid ID format (CastError) gracefully
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update specific profile fields
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth; 
    
    const allowedUpdates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bloodGroup: req.body.bloodGroup,
      location: req.body.location,
      organizationName: req.body.organizationName,
      // Add other safe fields like 'bio', 'phone' if you add them to the model later
    };

    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: allowedUpdates },
      { new: true }
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};