import { Webhook } from 'svix';
import User from '../models/User.js';

// @desc    Handle Clerk Webhooks (Sync User to DB)
// @route   POST /api/webhooks/clerk
export const clerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Error: CLERK_WEBHOOK_SECRET is missing');
    return res.status(500).json({ success: false, message: 'Server Configuration Error' });
  }

  // Verify Webhook Signature
  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  const payload = req.body; // Buffer from express.raw

  let evt;
  try {
    evt = wh.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"]
    });
  } catch (err) {
    console.error('Webhook Verification Failed:', err.message);
    return res.status(400).json({ success: false, message: 'Webhook Verification Failed' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType}`);

  try {
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
      console.log(`User ${id} created in MongoDB`);
    }

    // 2. Update User (New Improvement)
    if (eventType === 'user.updated') {
      const { email_addresses, first_name, last_name } = evt.data;
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0].email_address,
          firstName: first_name,
          lastName: last_name,
        }
      );
      console.log(`User ${id} updated in MongoDB`);
    }

    // 3. Delete User
    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`User ${id} deleted from MongoDB`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};