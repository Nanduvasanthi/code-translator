import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.js';
import { generateToken } from '../../utils/authHelpers.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google/login - Login existing Google user
router.post('/login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    console.log('🔐 [GOOGLE LOGIN] Verifying token...');
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, sub: googleId } = payload;
    
    const normalizedEmail = email.toLowerCase();
    
    console.log('👤 Google login attempt for:', normalizedEmail);
    
    // Find existing verified user
    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      isVerified: true 
    });
    
    // CASE 1: User not found
    if (!existingUser) {
      console.log('❌ No verified account found for:', normalizedEmail);
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please register first.',
        action: 'register',
        email: normalizedEmail,
        provider: 'google'
      });
    }
    
    // CASE 2: User registered with email/password
    if (existingUser.provider === 'local') {
      console.log('⚠️ User registered locally:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: 'This account is registered with email/password. Please login with email.',
        provider: 'email',
        email: existingUser.email,
        action: 'use_email'
      });
    }
    
    // CASE 3: User registered with Google but Google ID doesn't match
    if (existingUser.provider === 'google' && existingUser.googleId !== googleId) {
      console.log('⚠️ Google ID mismatch');
      return res.status(400).json({
        success: false,
        message: 'Please use the original Google account you registered with.',
        provider: 'google_wrong',
        action: 'use_correct_google'
      });
    }
    
    // CASE 4: SUCCESS - Google login (user exists with matching Google account)
    console.log('✅ [GOOGLE LOGIN SUCCESS] User:', existingUser.email);

    existingUser.lastLogin = new Date();
    try {
      await existingUser.save({ validateBeforeSave: false });
      console.log('🕐 Updated lastLogin for Google user:', existingUser.email, 'to', existingUser.lastLogin);
    } catch (saveError) {
      console.warn('⚠️ Could not update lastLogin for Google user:', saveError.message);
    }
    
    const token = generateToken(existingUser._id);
    
    res.status(200).json({
      success: true,
      message: 'Google login successful!',
      token,
      user: {
        id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        username: existingUser.username,
        email: existingUser.email,
        profilePicture: existingUser.profilePicture,
        isVerified: existingUser.isVerified,
        provider: existingUser.provider
      }
    });
    
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

export default router;