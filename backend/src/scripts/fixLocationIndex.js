/**
 * Migration Script: Fix 2dsphere Index
 * 
 * PURPOSE:
 * The old `location` index causes errors when a user document has
 * `location: { address, city, state }` but NO `type: 'Point'` or coordinates.
 * The new partial index only applies to documents where `location.type` = 'Point'.
 * 
 * HOW TO RUN (on MongoDB Atlas / your DB):
 * 1. Connect to your database (e.g., via `mongosh` or Atlas Data Explorer).
 * 2. Run the commands below.
 * 
 * OR you can run this script locally:
 * ```
 * node backend/src/scripts/fixLocationIndex.js
 * ```
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

        // Step 2: Create the new partial index
        await collection.createIndex(
            { location: "2dsphere" },
            { partialFilterExpression: { "location.type": "Point" } }
        );
        console.log("Created new PARTIAL 'location_2dsphere' index.");

        console.log("Migration complete!");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

runMigration();
