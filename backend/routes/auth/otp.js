import express from 'express';
import User from '../../models/User.js';
import { generateToken } from '../../utils/authHelpers.js';

const router = express.Router();

// POST /api/auth/verify-otp - Verify OTP for email registration
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, userData } = req.body;

        console.log('🔍 [OTP VERIFICATION] For email:', email);

        if (!email || !otp || !userData) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and user data are required'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Check if user already exists and is verified
        const existingUser = await User.findOne({ 
            email: normalizedEmail,
            isVerified: true 
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Verify OTP matches
        if (userData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (new Date() > new Date(userData.otpExpiry)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please register again.'
            });
        }

        // Check if username already exists among verified users
        const existingUsername = await User.findOne({ 
            username: userData.username,
            isVerified: true 
        });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken. Please register again with different username.'
            });
        }

        // NOW save user to database (only after OTP verification)
        const newUser = new User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            provider: userData.provider,
            isVerified: true,
            createdAt: new Date()
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        console.log('✅ User saved to database after OTP verification:', newUser.email);

        res.status(201).json({
            success: true,
            message: 'Email verified successfully! Account created.',
            token,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                username: newUser.username,
                isVerified: newUser.isVerified,
                provider: newUser.provider
            }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/auth/resend-otp - Resend OTP for registration
router.post('/resend-otp', async (req, res) => {
    try {
        const { email, userData } = req.body;

        if (!email || !userData) {
            return res.status(400).json({
                success: false,
                message: 'Email and user data are required'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Generate new OTP
        const { generateOTP, generateOTPExpiry } = await import('../../utils/authHelpers.js');
        const otp = generateOTP();
        const otpExpiry = generateOTPExpiry();

        // Update OTP in user data
        userData.otp = otp;
        userData.otpExpiry = otpExpiry;

        console.log(`📧 [OTP RESENT] New OTP for ${normalizedEmail}: ${otp}`);

        // Try to import sendOTPEmail dynamically
        let emailSent = true;
        try {
            const { sendOTPEmail } = await import('../../utils/emailService.js');
            emailSent = await sendOTPEmail(email, otp, `${userData.firstName} ${userData.lastName}`);
        } catch (emailError) {
            console.log('⚠️ Email service import failed, but OTP updated');
        }
        
        if (!emailSent) {
            console.log('⚠️ Email sending failed, but OTP updated');
        }

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully. Please check your email.',
            userData, // Return updated user data with new OTP
            email: normalizedEmail
        });

    } catch (error) {
        console.error('❌ [RESEND OTP ERROR]:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;