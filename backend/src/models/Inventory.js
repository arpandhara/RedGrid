import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    required: true 
  },
  quantity: { type: Number, default: 0 },
  // Optional: We could track separate batches with expiry dates, 
  // but for simplicity we'll just track total quantity for now.
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure one record per blood group per hospital
inventorySchema.index({ hospital: 1, bloodGroup: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);