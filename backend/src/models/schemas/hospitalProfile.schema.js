import mongoose from 'mongoose';

export const hospitalProfileSchema = new mongoose.Schema({
  hospitalName: String,
  registrationNumber: String, 
  type: { type: String, enum: ['government', 'private', 'ngo'] },
  bedsCount: Number,
  emergencyPhone: String,
  website: String,
  isVerified: { type: Boolean, default: false }
}, { _id: false });