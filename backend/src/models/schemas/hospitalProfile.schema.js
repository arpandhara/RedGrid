import mongoose from 'mongoose';

export const hospitalProfileSchema = new mongoose.Schema({
  hospitalName: String,
  registrationNumber: String, // The text ID (e.g., GST/License No)
  
  // NEW: The proof document
  licenseDocumentUrl: { type: String, default: null }, 
  
  type: { type: String, enum: ['government', 'private', 'ngo'] },
  bedsCount: Number,
  emergencyPhone: String,
  website: String,
  
  // DEFAULT IS FALSE. They are locked out until you verify them.
  isVerified: { type: Boolean, default: false } 
}, { _id: false });