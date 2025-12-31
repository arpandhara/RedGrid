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
  communicableDiseaseName: { type: String, default: null },
  fitnessCertificateUrl: { type: String, default: null }, // Stores the Supabase URL

  // --- GAMIFICATION ---
  badges: [{
      code: String, // e.g., 'FIRST_DROP', 'LIFE_SAVER'
      name: String,
      description: String,
      icon: String, // lucide icon name
      earnedAt: { type: Date, default: Date.now }
  }],

  // --- POINTS & REWARDS ---
  points: { type: Number, default: 0 },
  pointsHistory: [{
      reason: String, // e.g., 'Donation Verified', 'Referral'
      change: Number, // +50, -20
      date: { type: Date, default: Date.now }
  }]

}, { _id: false });