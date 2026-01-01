import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkLocations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const collection = mongoose.connection.db.collection('users');

        // Count users with valid GeoJSON location
        const validGeoCount = await collection.countDocuments({
            "location.type": "Point",
            "location.coordinates": { $exists: true, $ne: [] }
        });

        // Count total users
        const totalCount = await collection.countDocuments({});

        // Count donors with valid location
        const donorsWithGeo = await collection.countDocuments({
            role: "donor",
            "location.type": "Point",
            "location.coordinates": { $exists: true, $ne: [] }
        });

        console.log("\n=== LOCATION STATUS ===");
        console.log(`Total Users: ${totalCount}`);
        console.log(`Users with valid GeoJSON: ${validGeoCount}`);
        console.log(`Donors with valid GeoJSON: ${donorsWithGeo}`);

        // Sample a user without location
        const userWithoutGeo = await collection.findOne({ "location.type": { $ne: "Point" } });
        if (userWithoutGeo) {
            console.log("\n=== SAMPLE USER WITHOUT GEO ===");
            console.log(`Email: ${userWithoutGeo.email}`);
            console.log(`Location: ${JSON.stringify(userWithoutGeo.location)}`);
        }

        // Check indexes
        const indexes = await collection.indexes();
        console.log("\n=== CURRENT INDEXES ===");
        indexes.forEach(idx => console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`));

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkLocations();
