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

  // --- PASSWORD RESET FIELDS ---
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  
  // --- COMMON DETAILS ---
  firstName: String,
  lastName: String,
  phone: String,
  
  // --- LOCATION ---
  location: {
    address: String,
    city: String,
    state: String,
    type: {
      type: String, 
      enum: ['Point'], 
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },

  // --- MODULAR PROFILES ---
  donorProfile: donorProfileSchema,
  hospitalProfile: hospitalProfileSchema,
  orgProfile: orgProfileSchema

}, { timestamps: true });

// Indexes
userSchema.index({ "location": "2dsphere" });
// This index handles the "Time Bomb" feature for temporary events
userSchema.index({ "orgProfile.accountExpiresAt": 1 }, { expireAfterSeconds: 0 });
userSchema.index({ "donorProfile.bloodGroup": 1 });
userSchema.index({ "donorProfile.isAvailable": 1 });

const User = mongoose.model('User', userSchema);
export default User;