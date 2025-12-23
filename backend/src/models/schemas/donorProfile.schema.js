import mongoose from 'mongoose';

export const donorProfileSchema = new mongoose.Schema({
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null] 
  },
  dob: Date, 
  gender: { type: String, enum: ['male', 'female', 'other'] },
  weight: Number, // kg
  lastDonationDate: Date,
  isAvailable: { type: Boolean, default: true },
  
  // Health
  healthConditions: [{ type: String }], 
  medications: String,
  hasTattooOrPiercing: { type: Boolean, default: false },
  hasTravelledRecently: { type: Boolean, default: false },

  // --- NEW FIELDS FOR COMMUNICABLE DISEASES ---
  hasCommunicableDisease: { type: Boolean, default: false },
  communicableDiseaseName: { type: String, default: null },
  fitnessCertificateUrl: { type: String, default: null } // Stores the Supabase URL

}, { _id: false });