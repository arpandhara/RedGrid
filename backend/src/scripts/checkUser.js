
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '../../.env' }); // Adjust path to root .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const checkUser = async () => {
    await connectDB();
    const user = await User.findOne({ email: "arpandhara673@gmail.com" }); // Using the email from previous logs
    if (user) {
        console.log("USER FOUND:");
        console.log(JSON.stringify(user, null, 2));
    } else {
        console.log("User not found!");
    }
    process.exit();
};

checkUser();
