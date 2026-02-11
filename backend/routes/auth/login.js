import express from 'express';
import User from '../../models/User.js';
import { 
    comparePassword, 
    generateToken 
} from '../../utils/authHelpers.js';

const router = express.Router();

// POST /api/auth/login - Login with email and password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 [LOGIN REQUEST] Email:', email?.substring(0, 10) + '...');

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        
        // CASE 1: User not found
        if (!user) {
            console.log('❌ User not found:', normalizedEmail);
            return res.status(404).json({
                success: false,
                message: 'Account not found. Please register first.',
                action: 'register',
                email: normalizedEmail
            });
        }

        console.log('🔍 [USER FOUND] Provider:', user.provider, 'Verified:', user.isVerified);

        // CASE 2: User registered with Google
        if (user.provider === 'google') {
            return res.status(400).json({
                success: false,
                message: 'This account was registered with Google. Please login with Google.',
                provider: 'google',
                email: user.email,
                action: 'use_google'
            });
        }

        // CASE 3: Email not verified (only for local registration)
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first. Check your inbox for OTP.',
                needsVerification: true,
                userId: user._id,
                email: user.email,
                action: 'verify_email'
            });
        }

        // CASE 4: Check password
        const isPasswordValid = await comparePassword(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', user.email);
            return res.status(401).json({
                success: false,
                message: 'Invalid password. Please try again.',
                action: 'try_again'
            });
        }

        user.lastLogin = new Date();
        try {
            await user.save({ validateBeforeSave: false });
            console.log('🕐 Updated lastLogin for:', user.email, 'to', user.lastLogin);
        }  catch (saveError) {
            console.warn('⚠️ Could not update lastLogin:', saveError.message);
        }

        // CASE 5: SUCCESS - Email/password login
        const token = generateToken(user._id);

        console.log('✅ [LOGIN SUCCESS] User:', user.email);

        // SET COOKIES for session persistence
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'lax'
        });

        res.cookie('userEmail', user.email, {
            httpOnly: false, // Allow frontend to read
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });

        res.cookie('userName', user.firstName || user.email.split('@')[0], {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });

        res.cookie('userId', user._id.toString(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified,
                provider: user.provider,
                name: `${user.firstName} ${user.lastName}`.trim() || user.username || user.email.split('@')[0]
            }
        });

    } catch (error) {
        console.error('❌ [LOGIN ERROR]:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;