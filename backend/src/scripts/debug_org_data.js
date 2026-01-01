
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Donation from '../models/Donation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to backend/.env correctly
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const orgs = await User.find({ role: 'organization' });
        console.log(`Found ${orgs.length} Organizations.`);

        for (const org of orgs) {
            console.log(`\n--- Org: ${org.firstName} (${org.orgProfile?.organizationName}) [${org._id}] ---`);

            // 1. Check Requests (Created by Org)
            const requests = await Request.find({ requester: org._id });
            console.log(`> Created Requests: ${requests.length}`);
            requests.forEach(r => console.log(`  - [${r.status}] ${r.bloodGroup} for ${r.patientName}`));

            // 2. Check Donations (Scheduled Appointments for this Org)
            // Note: Donation model usually links to 'hospital' field for the destination center
            const donations = await Donation.find({ hospital: org._id });
            console.log(`> Scheduled/Received Donations: ${donations.length}`);
            donations.forEach(d => console.log(`  - [${d.status}] ${d.donationType} from Donor ${d.donor}`));
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
