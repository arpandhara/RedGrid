// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['blood_request', 'status_update', 'general', 'direct_request'], default: 'general' },
  title: String,
  message: String,
  relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);