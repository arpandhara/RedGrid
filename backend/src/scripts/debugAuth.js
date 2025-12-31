
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

dotenv.config({ path: '../../.env' });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        const email = "arpandhara673@gmail.com"; // The email from logs

        // 1. Check Mongo
        const dbUser = await User.findOne({ email });
        console.log("\n--- MONGO DB ---");
        if (dbUser) {
            console.log(`ID: ${dbUser._id}`);
            console.log(`ClerkID: ${dbUser.clerkId}`);
            console.log(`Email: ${dbUser.email}`);
        } else {
            console.log("User not found in DB");
        }

        // 2. Check Clerk
        console.log("\n--- CLERK API ---");
        const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
        
        if (clerkUsers.length > 0) {
            clerkUsers.forEach(u => {
                console.log(`Clerk User ID: ${u.id}`);
                console.log(`Email: ${u.emailAddresses[0].emailAddress}`);
                console.log(`Created At: ${new Date(u.createdAt).toISOString()}`);
            });
        } else {
            console.log("User not found in Clerk");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

debug();
