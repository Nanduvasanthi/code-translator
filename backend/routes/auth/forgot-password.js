import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { sendEmail } from '../../utils/sendEmail.js'; // Import from utils

const router = express.Router();

console.log('🔧 [AUTH] Loading forgot-password routes...');

// @desc    Forgot password - send reset email
// @route   POST /auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`📧 Forgot password request for: ${email}`);

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

        // Check if email is verified
        if (!user.isVerified) {
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

        // Create professional HTML email
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset - CodeTranslator</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f9f9f9;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 20px;
                        text-align: center;
                        color: white;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        padding: 40px 20px;
                        background-color: #ffffff;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 28px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .warning-box {
                        background-color: #fff8e1;
                        border-left: 4px solid #ffb300;
                        padding: 15px;
                        margin: 25px 0;
                        border-radius: 4px;
                    }
                    .token-box {
                        background-color: #f5f5f5;
                        padding: 15px;
                        border-radius: 4px;
                        font-family: monospace;
                        word-break: break-all;
                        margin: 15px 0;
                        font-size: 14px;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 12px;
                        text-align: center;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">CodeTranslator</div>
                        <h1 style="margin: 10px 0 0 0; font-size: 28px;">Password Reset Request</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Secure Your Account</p>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #333; margin-bottom: 10px;">Hello ${user.firstName},</h2>
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            You've requested to reset your password for your CodeTranslator account. 
                            Click the button below to create a new password:
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button" style="color: white; text-decoration: none;">
                                Reset Your Password
                            </a>
                        </div>
                        
                        <div class="warning-box">
                            <p style="margin: 0; color: #5d4037;">
                                <strong>⚠️ Important Security Notice:</strong><br>
                                This password reset link will expire in <strong>1 hour</strong>.<br>
                                If you didn't request this password reset, please ignore this email.
                            </p>
                        </div>
                        
                        <p style="color: #555; margin: 20px 0 10px 0;">
                            If the button above doesn't work, you can copy and paste the following link into your browser:
                        </p>
                        <div class="token-box">${resetUrl}</div>
                        
                        <p style="color: #555; line-height: 1.6;">
                            <strong>Need help?</strong> If you're having trouble resetting your password, 
                            please contact our support team or reply to this email.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 5px 0;">This is an automated message from CodeTranslator.</p>
                        <p style="margin: 5px 0;">📍 123 Tech Street, San Francisco, CA 94107</p>
                        <p style="margin: 5px 0;">© ${new Date().getFullYear()} CodeTranslator. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email using the actual sendEmail utility
        try {
            await sendEmail({
                to: user.email,
                subject: '🔐 CodeTranslator - Password Reset Request',
                html: html
            });
            
            console.log(`✅ Password reset email sent to: ${user.email}`);
            
            res.json({
                success: true,
                message: 'Password reset email sent successfully. Please check your inbox.'
            });
            
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            
            // Reset the token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            
            throw new Error('Failed to send email. Please try again.');
        }

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Reset password
// @route   POST /auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
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

        // Send confirmation email
        const confirmationHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
                    .content { padding: 30px; background: #ffffff; }
                    .success-box { background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Password Reset Successful</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.firstName},</h2>
                        <p>Your CodeTranslator account password was successfully reset on ${new Date().toLocaleString()}.</p>
                        
                        <div class="success-box">
                            <p><strong>✔️ Security Update Confirmed:</strong></p>
                            <p>You can now log in to your account using your new password.</p>
                        </div>
                        
                        <p>If you did not make this change, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated security notification from CodeTranslator.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send confirmation email
        try {
            await sendEmail({
                to: user.email,
                subject: '✅ CodeTranslator - Password Reset Confirmation',
                html: confirmationHtml
            });
            console.log(`✅ Confirmation email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('❌ Confirmation email failed:', emailError);
            // Don't fail the reset if confirmation email fails
        }

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
// @route   GET /auth/verify-reset-token/:token
// @access  Public
router.get('/verify-reset-token/:token', async (req, res) => {
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

console.log('✅ [AUTH] Forgot-password routes loaded');

export default router;