// models/Otp.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-registration', 'google-registration', 'reset-password'],
    required: true
  },
  userData: {
    type: mongoose.Schema.Types.Mixed, // Store complete user data
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' } // Auto-delete after 5 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookups
otpSchema.index({ email: 1, type: 1 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;