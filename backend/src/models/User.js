import mongoose from 'mongoose';
import { donorProfileSchema } from './schemas/donorProfile.schema.js';
import { hospitalProfileSchema } from './schemas/hospitalProfile.schema.js';
import { orgProfileSchema } from './schemas/orgProfile.schema.js';

const userSchema = new mongoose.Schema({
  // --- CORE IDENTITY ---
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['donor', 'organization', 'hospital', 'admin'], 
    default: 'donor' 
  },
  isOnboarded: { type: Boolean, default: false },
  
  // --- COMMON DETAILS ---
  firstName: String,
  lastName: String,
  phone: String,
  
  // --- LOCATION ---
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // --- MODULAR PROFILES ---
  donorProfile: donorProfileSchema,
  hospitalProfile: hospitalProfileSchema,
  orgProfile: orgProfileSchema

}, { timestamps: true });

// Indexes
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ "orgProfile.accountExpiresAt": 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model('User', userSchema);
export default User;