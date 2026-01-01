
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Donation from './src/models/Donation.js';
import User from './src/models/User.js';

dotenv.config({ quiet: true });

const checkAppointments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. List all pending donations
        const pendingDonations = await Donation.find({ status: 'pending' }).populate('hospital').populate('donor');
        console.log(`\nFound ${pendingDonations.length} Pending Donations:`);
        pendingDonations.forEach(d => {
            console.log(`- ID: ${d._id}`);
            console.log(`  Donor: ${d.donor?.firstName} ${d.donor?.lastName} (${d.donor?._id})`);
            console.log(`  To Hospital/Camp: ${d.hospital?.orgProfile?.organizationName || d.hospital?.hospitalProfile?.hospitalName} (${d.hospital?._id})`);
            console.log(`  Date: ${d.donationDate}`);
            console.log(`  -------------------`);
        });

        if (pendingDonations.length === 0) {
            console.log("  (None found. Did the schedule call succeed?)");
        }

        // 2. List all Organizations
        const orgs = await User.find({ role: 'organization' });
        console.log(`\nVerified Organizations in DB: ${orgs.length}`);
        orgs.forEach(o => {
            console.log(`- ${o.orgProfile?.organizationName} (ID: ${o._id})`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAppointments();
