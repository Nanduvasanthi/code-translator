import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { sendPasswordResetEmail } from '../../utils/passwordResetEmail.js';

const router = express.Router();

console.log('🔧 [AUTH] Loading password-reset routes...');

// @desc    Forgot password - send reset email
// @route   POST /auth/password-reset/forgot
// @access  Public
router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`📧 Password reset request for: ${email}`);

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`❌ No user found with email: ${email}`);
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address'
            });
        }

        // Check if user registered with Google
        if (user.provider === 'google') {
            console.log(`❌ Google user attempted password reset: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'This account was registered with Google. Please use Google Sign In.',
                provider: 'google'
            });
        }

        // Check if user is verified (if your system has isVerified field)
        if (user.isVerified === false) {
            return res.status(400).json({
                success: false,
                message: 'Please verify your email first before resetting password.',
                needsVerification: true
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token and set to user
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
            
        // Set token expiry (1 hour from now)
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        
        await user.save();
        console.log(`✅ Reset token generated for user: ${user.email}`);

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

        // Send password reset email using new service
        await sendPasswordResetEmail(
            user.email, 
            resetUrl, 
            user.firstName || 'User'
        );

        console.log(`✅ Password reset email sent to: ${user.email}`);

        res.json({
            success: true,
            message: 'Password reset email sent. Please check your inbox.'
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Reset password
// @route   POST /auth/password-reset/reset/:token
// @access  Public
router.post('/reset/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;

        console.log(`🔑 Reset password request for token: ${token.substring(0, 10)}...`);

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both new password and confirmation'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Hash token to compare with stored token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token and check expiry
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Check if user registered with Google
        if (user.provider === 'google') {
            return res.status(400).json({
                success: false,
                message: 'This account was registered with Google. Please use Google Sign In.',
                provider: 'google'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password and clear reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save();

        console.log(`✅ Password reset successful for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password reset successful! You can now login with your new password.'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Verify reset token
// @route   GET /auth/password-reset/verify/:token
// @access  Public
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log(`🔍 Verifying reset token: ${token.substring(0, 10)}...`);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Hash token to compare with stored token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token and check expiry
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            success: true,
            message: 'Valid reset token',
            email: user.email,
            firstName: user.firstName
        });

    } catch (error) {
        console.error('❌ Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

console.log('✅ [AUTH] Password-reset routes loaded');

export default router;