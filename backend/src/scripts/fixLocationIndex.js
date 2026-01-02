/**
 * Migration Script: Fix 2dsphere Index (Sparse)
 * 
 * PURPOSE:
 * Partial indexes don't work well with $near queries.
 * Using a SPARSE index instead - it only indexes documents where
 * the location field EXISTS, but doesn't require a specific value.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const collection = mongoose.connection.db.collection('users');

        // Step 1: Drop the old index (if it exists)
        try {
            await collection.dropIndex("location_2dsphere");
            console.log("Dropped old 'location_2dsphere' index.");
        } catch (e) {
            if (e.codeName === 'IndexNotFound') {
                console.log("Old index not found, skipping drop.");
            } else {
                throw e;
            }
        }

        // Step 2: Create a SPARSE 2dsphere index
        // Sparse index only includes documents where 'location' field exists
        await collection.createIndex(
            { location: "2dsphere" },
            {
                sparse: true,  // Only index docs where location exists
                name: "location_2dsphere_sparse"
            }
        );
        console.log("Created new SPARSE 'location_2dsphere' index.");

        console.log("Migration complete!");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

runMigration();
