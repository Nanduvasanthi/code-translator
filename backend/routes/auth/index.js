import express from 'express';
import registerRoutes from './register.js';
import loginRoutes from './login.js';
import googleRoutes from './google.js';
import googleLoginRoutes from './google-login.js';
import googleOtpRoutes from './google-otp.js';
import otpRoutes from './otp.js';
import forgotPasswordRoutes from './forgot-password.js'; 

const router = express.Router();

// ==================== MOUNT ALL AUTH ROUTES ====================

// 1. EMAIL/PASSWORD AUTH
router.use('/', registerRoutes);    // POST /register, POST /resend-otp
router.use('/', loginRoutes);       // POST /login


router.use('/', forgotPasswordRoutes); // POST /forgot-password, POST /reset-password/:toke

// 2. GOOGLE AUTH
router.use('/google', googleRoutes);      // POST /google/verify-token (Google registration start)
router.use('/google', googleOtpRoutes);   // POST /google/verify-google-otp, POST /google/resend-google-otp
router.use('/google', googleLoginRoutes); // POST /google/login (Google login for existing users)

// 3. OTP VERIFICATION (for email registration)
router.use('/', otpRoutes);         // POST /verify-otp, POST /resend-otp

// ==================== TEST & HEALTH ROUTES ====================

// Test route - shows all available endpoints
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auth API is working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      // Email/Password Auth
      register: 'POST /register',
      login: 'POST /login',
      verifyOtp: 'POST /verify-otp',
      resendOtp: 'POST /resend-otp',


      // Password Reset (NEW)
      forgotPassword: 'POST /forgot-password',
      resetPassword: 'POST /reset-password/:token',
      verifyResetToken: 'GET /verify-reset-token/:token',
      
      // Google Registration Flow
      googleVerifyToken: 'POST /google/verify-token',
      googleVerifyOtp: 'POST /google/verify-google-otp',
      googleResendOtp: 'POST /google/resend-google-otp',
      
      // Google Login
      googleLogin: 'POST /google/login',
      
      // Test & Health
      test: 'GET /test',
      health: 'GET /health'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

export default router;