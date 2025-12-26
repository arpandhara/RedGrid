import { Webhook } from 'svix';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../utils/emailService.js'; // Import the service

export const clerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return res.status(500).json({ success: false, message: 'Server Configuration Error' });
  }

  // Verify Webhook Signature
  const wh = new Webhook(SIGNING_SECRET);
  const headers = req.headers;
  const payload = req.body; 

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

  try {
    // --- HANDLE USER CREATION ---
    if (eventType === 'user.created') {
      const { email_addresses, first_name, last_name, unsafe_metadata } = evt.data;
      
      const email = email_addresses[0].email_address;
      const firstName = first_name || 'User';
      const role = unsafe_metadata?.role || 'donor';
      const organizationName = unsafe_metadata?.organizationName || null;
      const hospitalName = unsafe_metadata?.hospitalName || null;

      // 1. Check if user already exists
      let user = await User.findOne({ 
        $or: [{ clerkId: id }, { email: email }] 
      });

      if (user) {
        // User exists, update them instead
        user.clerkId = id; // Ensure clerkId is set
        user.firstName = firstName;
        user.lastName = last_name;
        user.role = role || user.role;
        // Don't overwrite existing organization/hospital names unless provided
        if (organizationName) user.organizationName = organizationName;
        if (hospitalName) user.hospitalName = hospitalName;
        
        await user.save();
        console.log(`User ${id} updated (already existed)`);
      } else {
        // 2. Create New User
        user = await User.create({
            clerkId: id,
            email: email,
            firstName: first_name,
            lastName: last_name,
            role: role,
            organizationName: organizationName,
            hospitalName: hospitalName,
            isOnboarded: false,
        });
        console.log(`User ${id} created as ${role}`);
        
        // 3. Send Welcome Email (only for new users)
        sendWelcomeEmail(email, firstName, role);
      }
    }

    // --- HANDLE USER UPDATE ---
    if (eventType === 'user.updated') {
      const { email_addresses, first_name, last_name, unsafe_metadata } = evt.data;
      
      const updateData = {
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
      };

      if (unsafe_metadata?.role) updateData.role = unsafe_metadata.role;

      await User.findOneAndUpdate({ clerkId: id }, updateData);
    }

    // --- HANDLE USER DELETION ---
    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};