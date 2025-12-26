import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The Hospital collecting it
  
  bloodGroup: { 
    type: String, 
    required: true 
  },
  quantityUnits: { type: Number, default: 1 },
  
  // Link to a specific request if this was a filled request
  relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  
  donationDate: { type: Date, default: Date.now },
  certificateId: { type: String, unique: true }, // For the certificate PDF later

  status: {
    type: String,
    enum: ['completed', 'processing', 'rejected'],
    default: 'completed'
  }
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);