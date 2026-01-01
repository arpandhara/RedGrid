
import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Hardcode URI if .env fails to load in this context, or rely on successful load
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blood_donation";

const checkCamps = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const orgs = await User.find({ role: 'organization' });
        const hospitals = await User.find({ role: 'hospital' });

        const report = {
            orgs: orgs.map(o => ({
                id: o._id,
                name: o.orgProfile?.organizationName,
                accountType: o.orgProfile?.accountType,
                expiresAt: o.orgProfile?.accountExpiresAt,
                isActiveTemporary: o.orgProfile?.accountType === 'temporary' && new Date(o.orgProfile?.accountExpiresAt) > new Date(),
                isPermanent: o.orgProfile?.accountType === 'permanent'
            })),
            hospitals: hospitals.map(h => ({
                id: h._id,
                name: h.hospitalProfile?.hospitalName
            }))
        };

        console.log("JSON_START");
        console.log(JSON.stringify(report, null, 2));
        console.log("JSON_END");

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCamps();
