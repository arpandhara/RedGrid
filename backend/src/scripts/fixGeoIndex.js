import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Drop existing indexes to start fresh
    try {
        await User.collection.dropIndex('location_2dsphere');
        console.log('Dropped old location index');
    } catch (e) {
        console.log('No old index to drop');
    }

    // 2. Find users with invalid location data (missing coordinates but having address)
    // We should ensure that if location exists, coordinates exists.
    // If coordinates is missing, we can delete the location object or set coordinates to [0,0] (Null Island)
    
    // Better strategy: Unset 'location' for anyone who doesn't have valid coordinates
    // effectively "deactivating" their location features until they update profile again.
    
    const res = await User.updateMany(
        { 
            "location.coordinates": { $exists: false },
            "location": { $exists: true } 
        }, 
        { $unset: { "location": "" } }
    );
    
    console.log(`Cleaned up ${res.modifiedCount} users with invalid location.`);

    const res2 = await User.updateMany(
        { "location.coordinates": { $size: 0 } },
        { $unset: { "location": "" } }
    );
    console.log(`Cleaned up ${res2.modifiedCount} users with empty coordinates.`);

    // 3. Create Indexes
    await User.createIndexes();
    console.log('Indexes Re-created Successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndexes();
