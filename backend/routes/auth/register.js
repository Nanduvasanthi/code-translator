// routes/auth/register.js
import express from 'express';
import User from '../../models/User.js';
import Otp from '../../models/Otp.js';
import { 
    hashPassword, 
    generateOTP 
} from '../../utils/authHelpers.js';
import { sendOTPEmail } from '../../utils/emailService.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register - Register new user (temporary, stored in Otp)
router.post('/register', async (req, res) => {
    try {
        console.log('🚀 ========== EMAIL REGISTRATION START ==========');
        
        const { firstName, lastName, username, email, password } = req.body;

        console.log('🔍 [EMAIL REGISTRATION] Data received:', {
            firstName,
            lastName,
            username,
            email
        });

        // Validation
        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters long'
            });
        }

        const normalizedEmail = email.toLowerCase();
        const normalizedUsername = username.toLowerCase().trim();

        // Check if user already exists in database (verified users)
        const existingUser = await User.findOne({ 
            email: normalizedEmail,
            isVerified: true 
        });
        
        if (existingUser) {
            console.log('🔍 [USER EXISTS] Verified user found:', existingUser.email);
            
            // CASE 1: Email already registered with Email/Password
            if (existingUser.provider === 'local') {
                return res.status(409).json({
                    success: false,
                    userExists: true,
                    email: existingUser.email,
                    provider: 'email',
                    message: 'Account already exists with email. Please login with your email and password.'
                });
            }
            
            // CASE 2: Email already registered with Google
            if (existingUser.provider === 'google') {
                return res.status(409).json({
                    success: false,
                    userExists: true,
                    email: existingUser.email,
                    provider: 'google',
                    message: 'Account already exists with Google. Please login with Google.'
                });
            }
        }

        // CASE 3: Check if username already exists (any provider)
        const existingUsername = await User.findOne({ 
            username: normalizedUsername,
           
        });
        
        if (existingUsername) {
            console.log('🔍 [USERNAME TAKEN] Username already exists:', normalizedUsername);
            return res.status(409).json({
                success: false,
                usernameTaken: true,
                message: 'Username already taken. Please choose another.'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Check if there's a pending OTP for this email
        const existingOtp = await Otp.findOne({
            email: normalizedEmail,
            type: 'email-registration'
        });
        
        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        if (existingOtp) {
            // Update existing OTP instead of creating new
            existingOtp.otp = otp;
            existingOtp.expiresAt = expiresAt;
            existingOtp.userData = {
                firstName,
                lastName,
                username: normalizedUsername,
                email: normalizedEmail,
                password: hashedPassword,
                provider: 'local'
            };
            await existingOtp.save();
            
            console.log('🔄 Updated existing OTP for:', normalizedEmail);
        } else {
            // Create new OTP record
            const userData = {
                firstName,
                lastName,
                username: normalizedUsername,
                email: normalizedEmail,
                password: hashedPassword,
                provider: 'local'
            };
            
            const otpRecord = new Otp({
                email: normalizedEmail,
                otp,
                type: 'email-registration',
                userData,
                expiresAt
            });
            
            await otpRecord.save();
            console.log('💾 New OTP saved for:', normalizedEmail);
        }

        // Send OTP email
        console.log('📧 Sending OTP email...');
        const emailSent = await sendOTPEmail(email, otp, `${firstName} ${lastName}`);
        
        if (!emailSent) {
            console.log('⚠️ Email sending failed, but OTP saved');
        }

        console.log('✅ Registration request processed. OTP sent.');
        console.log('🚀 ========== REGISTRATION REQUEST END ==========');

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            email: normalizedEmail,
            needsVerification: true
        });

    } catch (error) {
        console.error('❌ [REGISTER ERROR]:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/auth/verify-otp - Verify OTP and save user to DB
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log('🔍 [EMAIL OTP VERIFICATION] For email:', email);

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
            type: 'email-registration',
            expiresAt: { $gt: new Date() } // Not expired
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // CASE 8: Check if user already exists (verified) - double check
        const existingUser = await User.findOne({ 
            email: normalizedEmail,
            isVerified: true 
        });
        
        if (existingUser) {
            // Clean up OTP record
            await Otp.deleteOne({ _id: otpRecord._id });
            
            return res.status(409).json({
                success: false,
                userExists: true,
                message: 'User already verified. Please login.',
                provider: existingUser.provider,
                email: existingUser.email
            });
        }

        // CASE 3: Check if username already exists (race condition check)
        let finalUsername = otpRecord.userData.username;
        let usernameExists = await User.findOne({ 
            username: finalUsername,
            isVerified: true 
        });
        
        if (usernameExists) {
            // Generate new username with random number
            finalUsername = `${otpRecord.userData.username}${Math.floor(Math.random() * 1000)}`;
            console.log('🔄 Generated new username due to conflict:', finalUsername);
        }

        // Create and save verified user to database
        const newUser = new User({
            firstName: otpRecord.userData.firstName,
            lastName: otpRecord.userData.lastName,
            username: finalUsername,
            email: otpRecord.userData.email,
            password: otpRecord.userData.password,
            provider: 'local',
            isVerified: true
        });

        await newUser.save();

        // Clean up OTP record
        await Otp.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
        const { generateToken } = await import('../../utils/authHelpers.js');
        const token = generateToken(newUser._id);

        console.log('✅ [USER VERIFIED AND SAVED]:', newUser.email);

        res.status(201).json({
            success: true,
            message: 'Email verified successfully! Account created.',
            token,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                email: newUser.email,
                isVerified: newUser.isVerified,
                provider: newUser.provider
            }
        });

    } catch (error) {
        console.error('❌ [OTP VERIFICATION ERROR]:', error);
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
            type: 'email-registration'
        });

        if (!existingOtp) {
            return res.status(404).json({
                success: false,
                message: 'No pending registration found. Please register again.'
            });
        }

        // CASE 9: Check if user was already verified while OTP was pending
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
                message: 'Account already verified. Please login.',
                provider: existingUser.provider
            });
        }

        // Generate new OTP
        const newOtp = generateOTP();
        const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP record
        existingOtp.otp = newOtp;
        existingOtp.expiresAt = newExpiry;
        await existingOtp.save();

        console.log(`📧 [OTP RESENT] New OTP for ${normalizedEmail}: ${newOtp}`);

        // Send OTP email
        await sendOTPEmail(
            email, 
            newOtp, 
            `${existingOtp.userData.firstName} ${existingOtp.userData.lastName}`
        );

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully. Please check your email.',
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