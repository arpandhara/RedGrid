// backend/src/models/Request.js
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The Hospital
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For P2P
  isDirect: { type: Boolean, default: false },
  patientName: { type: String, required: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    required: true 
  },
  unitsNeeded: { type: Number, required: true },
  urgency: { type: String, enum: ['critical', 'moderate', 'low'], default: 'moderate' },
  
  // Location is usually the Hospital's location, but copied here for query efficiency
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },

  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'fulfilled', 'cancelled', 'rejected'], 
    default: 'pending' 
  },
  
  // Tracks who accepted it
  acceptedBy: [{ 
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['accepted', 'completed', 'no-show'], default: 'accepted' }
  }]
}, { timestamps: true });

requestSchema.index({ location: '2dsphere' });

export default mongoose.model('Request', requestSchema);