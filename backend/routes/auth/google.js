// routes/auth/google.js
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import Otp from '../../models/Otp.js';
import User from '../../models/User.js';
import { sendOTPEmail } from '../../utils/emailService.js';
import { generateToken } from '../../utils/authHelpers.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google/verify-token
router.post('/verify-token', async (req, res) => {
  try {
    const { credential } = req.body;
    
    console.log('🔐 [GOOGLE AUTH] Verifying token...');
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub } = payload;
    
    const normalizedEmail = email.toLowerCase();
    
    console.log('👤 Google user data:', {
      email: normalizedEmail,
      firstName: given_name,
      lastName: family_name,
      googleId: sub
    });
    
    // CASE 1: Check if email already registered (verified users only)
    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      isVerified: true 
    });
    
    if (existingUser) {
      console.log('🔍 [USER EXISTS] Verified user found:', {
        email: existingUser.email,
        provider: existingUser.provider
      });
      
      // CASE 1A: Email already registered with Google
      if (existingUser.provider === 'google') {
        return res.status(409).json({
          success: false,
          userExists: true,
          email: existingUser.email,
          provider: 'google',
          message: 'Account already exists with Google. Please login with Google.'
        });
      }
      
      // CASE 1B: Email already registered with Email/Password
      if (existingUser.provider === 'local') {
        return res.status(409).json({
          success: false,
          userExists: true,
          email: existingUser.email,
          provider: 'email',
          message: 'Account already exists with email. Please login with your email and password.'
        });
      }
    }
    
    // Generate unique username
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // CASE 2: Check if username already exists (any provider)
    while (await User.findOne({ username: username })) {
      username = `${baseUsername}${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        username = `${baseUsername}${Date.now()}`;
        break;
      }
    }
    
    // Double check username doesn't exist (race condition)
    const finalUsernameCheck = await User.findOne({ 
      username: username, 
      
    });
    
    if (finalUsernameCheck) {
      console.log('🔍 [USERNAME TAKEN] Even after generation:', username);
      return res.status(409).json({
        success: false,
        usernameTaken: true,
        message: 'Username already taken. Please try Google sign-in again.'
      });
    }
    
    // Prepare user data for OTP record
    const userData = {
      googleId: sub,
      firstName: given_name,
      lastName: family_name || '',
      username: username,
      email: normalizedEmail,
      profilePicture: picture || '',
      provider: 'google'
    };
    
    // Check if there's a pending OTP for this email
    const existingOtp = await Otp.findOne({
      email: normalizedEmail,
      type: 'google-registration'
    });
    
    // Generate OTP
    const otp = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    if (existingOtp) {
      // Update existing OTP
      existingOtp.otp = otp;
      existingOtp.expiresAt = expiresAt;
      existingOtp.userData = userData;
      await existingOtp.save();
      
      console.log('🔄 Updated existing Google OTP for:', normalizedEmail);
    } else {
      // Create new OTP
      const otpRecord = new Otp({
        email: normalizedEmail,
        otp,
        type: 'google-registration',
        userData: userData,
        expiresAt
      });
      
      await otpRecord.save();
      console.log('💾 New Google OTP saved for:', normalizedEmail);
    }
    
    console.log('💾 OTP saved with user data:', {
      email: normalizedEmail,
      otp,
      expiresAt,
      username: username
    });
    
    // Send OTP via email
    await sendOTPEmail(normalizedEmail, otp, 'Google Registration Verification');
    
    // For development, log OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 DEV OTP for ${normalizedEmail}: ${otp}`);
    }
    
    res.json({
      success: true,
      needsVerification: true,
      email: normalizedEmail,
      message: 'OTP sent to email for verification',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only send in dev
    });
    
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

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

    // CASE 3: Check if user already exists (verified) - double check
    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      isVerified: true 
    });
    
    if (existingUser) {
      // Clean up OTP record
      await Otp.deleteOne({ _id: otpRecord._id });
      
      // Determine provider for proper message
      const provider = existingUser.provider === 'google' ? 'Google' : 'email';
      
      return res.status(409).json({
        success: false,
        userExists: true,
        email: existingUser.email,
        provider: existingUser.provider,
        message: `Account already exists with ${provider}. Please login.`
      });
    }

    // CASE 4: Check if username already exists (race condition)
    let finalUsername = otpRecord.userData.username;
    let existingUsername = await User.findOne({ 
      username: finalUsername,
      isVerified: true 
    });
    
    if (existingUsername) {
      // Generate new username
      finalUsername = otpRecord.userData.username + Math.floor(Math.random() * 1000);
      console.log('🔄 Generated new username due to conflict:', finalUsername);
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

    // Check if user was already verified while OTP was pending
    const existingUser = await User.findOne({
      email: normalizedEmail,
      isVerified: true
    });

    if (existingUser) {
      // Clean up stale OTP record
      await Otp.deleteOne({ _id: existingOtp._id });
      
      return res.status(409).json({
        success: false,
        userExists: true,
        email: existingUser.email,
        provider: existingUser.provider,
        message: 'Account already verified. Please login.'
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
    await sendOTPEmail(
      email, 
      newOtp, 
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

export default router;