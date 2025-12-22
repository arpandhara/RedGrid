import { Webhook } from 'svix';
import User from '../models/User.js';

// @desc    Handle Clerk Webhooks (Sync User to DB)
// @route   POST /api/auth/webhook
export const clerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Error: CLERK_WEBHOOK_SECRET is missing');
  }

  // Verify Webhook Signature
  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  const payload = req.body; // Note: This must be raw in the route!

  let evt;
  try {
    evt = wh.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"]
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Webhook Verification Failed' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  // 1. Create User
  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name } = evt.data;
    await User.create({
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
      isOnboarded: false,
    });
    console.log(`User ${id} synced to MongoDB`);
  }

  // 2. Delete User
  if (eventType === 'user.deleted') {
    await User.findOneAndDelete({ clerkId: id });
  }

  res.status(200).json({ success: true, message: 'Webhook received' });
};

// @desc    Onboard User (Set Role & Details)
// @route   POST /api/auth/onboarding
export const onboardUser = async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk Middleware
    const { role, bloodGroup, location, organizationName } = req.body;

    // Basic Logic: If Donor, require Blood Group. If Org, require Name.
    if (role === 'donor' && !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group required' });
    }
    if ((role === 'organization' || role === 'hospital') && !organizationName) {
      return res.status(400).json({ success: false, message: 'Organization name required' });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        role,
        bloodGroup: role === 'donor' ? bloodGroup : null,
        organizationName: (role !== 'donor') ? organizationName : null,
        location,
        isOnboarded: true
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};