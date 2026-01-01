import mongoose from 'mongoose';
import logger from './logger.js';
import env from './env.js'; // Ensure env vars are validated

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    logger.info(`MongoDB Connected: ${conn.connection.host} ✅`);
  } catch (error) {
    logger.error(`MongoDB Failed to Connect ❌`);
    logger.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;