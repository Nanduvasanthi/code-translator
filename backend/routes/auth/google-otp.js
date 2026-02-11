// routes/auth/google-otp.js
import express from 'express';
import Otp from '../../models/Otp.js';
import User from '../../models/User.js';
import { sendOTPEmail } from '../../utils/emailService.js';
import { generateToken } from '../../utils/authHelpers.js';

const router = express.Router();

// POST /api/auth/google/verify-google-otp
router.post('/verify-google-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 [GOOGLE OTP VERIFICATION] For email:', email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find OTP record
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp,
      type: 'google-registration',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Check if user already exists (verified)
    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      isVerified: true 
    });
    
    if (existingUser) {
      // Clean up OTP record
      await Otp.deleteOne({ _id: otpRecord._id });
      
      return res.status(409).json({
        success: false,
        message: 'User already exists. Please login.'
      });
    }

    // Check if username already exists
    let finalUsername = otpRecord.userData.username;
    let existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      // Generate new username
      finalUsername = otpRecord.userData.username + Math.floor(Math.random() * 1000);
    }

    // Create and save verified user to database
    const newUser = new User({
      firstName: otpRecord.userData.firstName,
      lastName: otpRecord.userData.lastName,
      username: finalUsername,
      email: otpRecord.userData.email,
      googleId: otpRecord.userData.googleId,
      profilePicture: otpRecord.userData.profilePicture,
      provider: 'google',
      isVerified: true
    });

    await newUser.save();

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = generateToken(newUser._id);

    console.log('✅ [GOOGLE USER VERIFIED AND SAVED]:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'Google account verified successfully!',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        isVerified: newUser.isVerified,
        provider: newUser.provider
      }
    });

  } catch (error) {
    console.error('❌ [GOOGLE OTP VERIFICATION ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/google/resend-google-otp
router.post('/resend-google-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find existing OTP record
    const existingOtp = await Otp.findOne({
      email: normalizedEmail,
      type: 'google-registration'
    });

    if (!existingOtp) {
      return res.status(404).json({
        success: false,
        message: 'No pending Google registration found.'
      });
    }

    // Generate new OTP
    const newOtp = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Update OTP record
    existingOtp.otp = newOtp;
    existingOtp.expiresAt = newExpiry;
    await existingOtp.save();

    console.log(`📧 [GOOGLE OTP RESENT] New OTP for ${normalizedEmail}: ${newOtp}`);

    // Send OTP email
    await sendOTPEmail(email, newOtp, 
      `${existingOtp.userData.firstName} ${existingOtp.userData.lastName}`
    );

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
      email: normalizedEmail
    });

  } catch (error) {
    console.error('❌ [GOOGLE RESEND OTP ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; // Make sure this export is there