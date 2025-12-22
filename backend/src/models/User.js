import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  
  role: { 
    type: String, 
    enum: ['donor', 'organization', 'hospital', 'admin'], 
    default: 'donor' 
  },
  
  isOnboarded: { type: Boolean, default: false },

  firstName: String,
  lastName: String,
  
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null 
  },
  
  // For Organizations/Hospitals
  organizationName: String,
  
  // Common Location Data
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;