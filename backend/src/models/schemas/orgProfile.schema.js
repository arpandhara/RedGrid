import mongoose from 'mongoose';

export const orgProfileSchema = new mongoose.Schema({
  organizationName: String,
  representativeName: String,
  licenseNumber: String,
  accountType: { type: String, enum: ['permanent', 'temporary'], default: 'permanent' },
  accountExpiresAt: { type: Date, default: null } 
}, { _id: false });