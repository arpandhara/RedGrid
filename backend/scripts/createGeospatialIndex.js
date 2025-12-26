
import 'dotenv/config';
import mongoose from 'mongoose';

const createIndex = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is undefined. Check .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // Drop potential conflicting indexes
        try {
            await collection.dropIndex('location_2dsphere');
            console.log('Dropped existing location_2dsphere index.');
        } catch (e) {
            console.log('No existing legacy index to drop.');
        }

        // Create the correct index
        console.log('Creating 2dsphere index on "location"...');
        const result = await collection.createIndex({ location: "2dsphere" });
        console.log('Index created successfully:', result);

        process.exit(0);
    } catch (error) {
        console.error('Error creating index:', error);
        process.exit(1);
    }
};

createIndex();
