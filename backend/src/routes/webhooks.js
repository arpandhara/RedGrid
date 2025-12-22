import express from 'express';
import { Webhook } from 'svix';
import User from '../models/Users.js';

const router = express.Router();

// This route must handle the raw body for signature verification
router.post('/clerk', async (req, res) => {
  try {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
      console.error('Error: CLERK_WEBHOOK_SECRET is missing in .env');
      return res.status(500).json({ success: false, message: 'Server Config Error' });
    }

    // Get the headers and body
    const headers = req.headers;
    const payload = req.body;

    // Create a new Svix instance with your secret.
    const wh = new Webhook(SIGNING_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        "svix-id": headers["svix-id"],
        "svix-timestamp": headers["svix-timestamp"],
        "svix-signature": headers["svix-signature"]
      });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ success: false, message: 'Webhook verification failed' });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    console.log('Webhook body:', evt.data);

    // --- HANDLE EVENTS ---

    // 1. User Created
    if (eventType === 'user.created') {
      const { email_addresses, first_name, last_name } = evt.data;
      
      const newUser = new User({
        clerkId: id,
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
        isOnboarded: false, 
      });

      await newUser.save();
      console.log('User created in MongoDB');
    }

    // 2. User Deleted
    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
      console.log('User deleted from MongoDB');
    }

    // 3. User Updated (Optional: Sync changes if they edit profile in Clerk)
    if (eventType === 'user.updated') {
        const { first_name, last_name } = evt.data;
        await User.findOneAndUpdate({ clerkId: id }, {
            firstName: first_name,
            lastName: last_name
        });
        console.log('User updated in MongoDB');
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;