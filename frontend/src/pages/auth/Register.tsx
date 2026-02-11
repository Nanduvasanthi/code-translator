import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code2, Eye, EyeOff, Shield, RefreshCw, CheckCircle, X, AlertCircle,
  User, Mail, Lock, Loader2, Check, AlertTriangle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import registerImage from '../../assets/register.jpg';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Type definitions
interface AlreadyRegisteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'email' | 'google';
  email: string;
  onSwitchToLogin: () => void;
}

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (userData: any) => void;
  onResendOtp: () => Promise<void>;
  otpTimer: number;
  type?: 'google' | 'email';
}

// Loading Spinner Component
const LoadingSpinner = ({ size = 20 }: { size?: number }) => (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin" size={size} />
  </div>
);

// Already Registered Modal Component
const AlreadyRegisteredModal: React.FC<AlreadyRegisteredModalProps> = ({
  isOpen,
  onClose,
  provider,
  email,
  onSwitchToLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              provider === 'google' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {provider === 'google' ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <Mail className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Already Exists
              </h2>
              <p className="text-sm text-gray-500 break-all">
                {email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center">
              {provider === 'email' 
                ? "You're already registered with email and password. Please use your email and password to login."
                : "You're already registered with Google. Please login with your Google account."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Sparkles size={18} />
              Go to Login
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Try Different Email
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t rounded-b-2xl">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Your account security is our priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// OTP Verification Modal Component
const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerificationSuccess,
  onResendOtp,
  otpTimer,
  type = 'google',
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setOtp(new Array(6).fill(''));
      setError('');
      setSuccess('');
    } else {
      // Focus first input when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (otp.every(digit => digit !== '') && !loading) {
      handleOtpSubmit(new Event('submit') as any);
    }
  }, [otp]);

  const handleOtpChange = (value: string, index: number) => {
    const char = value.charAt(0);
    
    if (char && !/^[A-Za-z0-9]$/.test(char)) return;
    
    const newOtp = [...otp];
    newOtp[index] = char.toUpperCase(); // Convert to uppercase for consistency
    setOtp(newOtp);
    
    if (char && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
    }
    
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().toUpperCase();
    
    if (!/^[A-Za-z0-9]{6}$/.test(pastedData)) {
      setError('Invalid OTP format. Must be 6 alphanumeric characters.');
      return;
    }
    
    const otpArray = pastedData.split('');
    setOtp(otpArray);
    
    setTimeout(() => inputRefs.current[5]?.focus(), 10);
  };

  const handleResendOtpWithLoading = async () => {
    if (otpTimer > 0 || resending) return;
    
    setResending(true);
    try {
      await onResendOtp();
    } finally {
      setResending(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-character OTP');
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = type === 'google' 
        ? '/api/auth/google/verify-google-otp' 
        : '/api/auth/verify-otp';
      
      // Both endpoints expect { email, otp }
      const body = { email, otp: otpString };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.message || 'Verification failed');
      }

      setSuccess('Email verified successfully!');
      
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      setTimeout(() => {
        onVerificationSuccess(result);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      // Shake animation on error
      const inputs = document.querySelectorAll('.otp-input');
      inputs.forEach(input => {
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      });
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Verify Your Email
              </h2>
              <p className="text-sm text-gray-500">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-gray-700 break-all">
                {email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check size={16} />
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleOtpSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Enter 6-digit Verification Code
                </label>
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      className="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-400"
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                      onFocus={(e) => e.target.select()}
                      maxLength={1}
                      disabled={loading}
                      autoFocus={index === 0}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-2">
                    <Mail size={14} />
                    <span>Code sent to {email}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Code is case-sensitive • Valid for 5 minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  {otpTimer > 0 ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Resend in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                    </span>
                  ) : (
                    <span>Didn't receive code?</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleResendOtpWithLoading}
                  disabled={otpTimer > 0 || loading || resending}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
                >
                  {resending ? (
                    <LoadingSpinner size={16} />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend Code
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isOtpComplete || loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size={18} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify & Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 bg-gray-50 border-t rounded-b-2xl">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>End-to-end encrypted verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Clock icon component
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const calculateStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = calculateStrength();
  const width = `${(strength / 4) * 100}%`;

  const getColor = () => {
    if (password.length === 0) return 'bg-gray-200';
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getText = () => {
    if (password.length === 0) return 'Enter a password';
    if (strength <= 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getRequirements = () => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' },
      { met: /[^A-Za-z0-9]/.test(password), text: 'One special character' },
    ];
    return requirements;
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Password strength:</span>
        <span className={`font-medium ${
          strength <= 1 ? 'text-red-500' :
          strength === 2 ? 'text-yellow-500' :
          strength === 3 ? 'text-blue-500' :
          'text-green-500'
        }`}>
          {getText()}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {getRequirements().map((req, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {req.met ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-300" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-gray-400'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showEmailOTPVerification, setShowEmailOTPVerification] = useState(false);
  const [showGoogleOTPVerification, setShowGoogleOTPVerification] = useState(false);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [alreadyRegisteredInfo, setAlreadyRegisteredInfo] = useState<{
    provider: 'email' | 'google';
    email: string;
  } | null>(null);
  const [emailOTPEmail, setEmailOTPEmail] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const rawAPI_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_URL = rawAPI_URL.replace(/\/api\/auth(\/|$)/, '');

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Auto-clear field errors when user starts typing
  useEffect(() => {
    if (usernameError && formData.username) {
      const timer = setTimeout(() => setUsernameError(''), 3000);
      return () => clearTimeout(timer);
    }
    if (emailError && formData.email) {
      const timer = setTimeout(() => setEmailError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [formData.username, formData.email, usernameError, emailError]);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
    
    // Clear field-specific errors when user starts typing
    if (field === 'username') {
      setUsernameError('');
    }
    if (field === 'email') {
      setEmailError('');
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (formData.firstName.length < 2) errors.push('First name must be at least 2 characters');
    if (formData.lastName.length < 2) errors.push('Last name must be at least 2 characters');
    if (formData.username.length < 3) errors.push('Username must be at least 3 characters');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) errors.push('Please enter a valid email address');
    
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
      return;
    }

    setIsLoading(true);
    setError('');
    setUsernameError('');
    setEmailError('');
    
    try {
      console.log('🔍 ========== EMAIL REGISTRATION START ==========');
      console.log('📝 Attempting email registration for:', formData.email);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('🔍 BACKEND RESPONSE:', data);

      // CASE 1: SUCCESS - OTP sent, needs verification
      if (data.success && data.needsVerification) {
        console.log('✅ OTP sent successfully');
        setEmailOTPEmail(formData.email);
        setShowEmailOTPVerification(true);
        setOtpTimer(300);
        setSuccess('Registration successful! Please verify your email.');
        return;
      }

      // CASE 2: Username already exists (CASE 5)
      if (data.usernameTaken) {
        console.log('❌ Username already taken');
        setUsernameError('This username is already taken. Please choose a different username.');
        setFormData(prev => ({ ...prev, username: '' }));
        setIsLoading(false);
        return;
      }

      // CASE 3: User already registered with EMAIL (CASE 4)
      if (data.userExists && data.provider === 'email') {
        console.log('🟡 User already registered with email');
        setEmailError('This email is already registered. Please use email and password to login.');
        showAlreadyRegisteredModal(data.email || formData.email, 'email');
        setIsLoading(false);
        return;
      }

      // CASE 4: User already registered with GOOGLE (CASE 3)
      if (data.userExists && data.provider === 'google') {
        console.log('🟡 User already registered with Google');
        setEmailError('This email is already registered with Google. Please use Google sign-in to login.');
        showAlreadyRegisteredModal(data.email || formData.email, 'google');
        setIsLoading(false);
        return;
      }

      // CASE 5: Any other error
      console.log('🔍 Showing general error message');
      setError(data.message || data.error || 'Registration failed. Please try again.');
      
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError('Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlreadyRegisteredModal = (email: string, provider: 'email' | 'google') => {
    console.log(`🟡 Showing modal for: ${email} (${provider})`);
    
    setAlreadyRegisteredInfo({
      provider,
      email
    });
    setShowAlreadyRegistered(true);
    
    // Clear form fields based on provider
    if (provider === 'email') {
      setFormData(prev => ({ 
        ...prev, 
        email: '', 
        password: '', 
        confirmPassword: '' 
      }));
    } else if (provider === 'google') {
      setFormData(prev => ({ ...prev, email: '' }));
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError('');
    setUsernameError('');
    setEmailError('');
    
    try {
      console.log('🔐 GOOGLE OAUTH START');
      
      const response = await fetch(`${API_URL}/api/auth/google/verify-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      console.log('📡 Response status:', response.status);
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        setError('Server error. Please try again.');
        return;
      }
      
      // Handle the response
      if (data.success) {
        console.log('✅ Google auth successful!');
        
        // User exists and is verified - auto login
        if (data.token && data.user) {
          console.log('   Auto-login successful');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/HomePage');
          return;
        }
        // New user or needs verification
        else if (data.needsVerification) {
          console.log('✅ User needs email verification');
          setGoogleEmail(data.email);
          setShowGoogleOTPVerification(true);
          setOtpTimer(300);
          setSuccess('Verification code sent to your email!');
          return;
        }
      } 
      
      // CASE 1: Username already taken (from Google sign-up)
      if (data.usernameTaken) {
        console.log('❌ Username conflict with Google sign-up');
        setUsernameError('Username already taken. Please try Google sign-in again or choose a different username.');
        setGoogleLoading(false);
        return;
      }
      
      // CASE 2: User already registered with EMAIL (CASE 2)
      if (data.userExists && data.provider === 'email') {
        console.log('🟡 User already registered with email');
        setEmailError('This email is already registered with email and password. Please use email login instead.');
        showAlreadyRegisteredModal(data.email, 'email');
        setGoogleLoading(false);
        return;
      }
      
      // CASE 3: User already registered with GOOGLE (CASE 1)
      if (data.userExists && data.provider === 'google') {
        console.log('🟡 User already registered with Google');
        setEmailError('This email is already registered with Google. Please use Google sign-in.');
        showAlreadyRegisteredModal(data.email, 'google');
        setGoogleLoading(false);
        return;
      }
      
      // Any other error
      console.error('❌ Google auth failed:', data.message);
      setError(data.message || 'Google authentication failed. Please try again.');
      
    } catch (error: any) {
      console.error('❌ Google auth failed with exception:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  const handleSwitchToLogin = () => {
    setShowAlreadyRegistered(false);
    navigate('/auth/login');
  };

  const handleResendEmailOTP = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOTPEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOtpTimer(300);
        setSuccess('New OTP sent to your email!');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendGoogleOTP = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google/resend-google-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail })
      });
      
      const data = await response.json();
      if (data.success) {
        setOtpTimer(300);
        setSuccess('New OTP sent to your email!');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Resend Google OTP error:', err);
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerificationSuccess = (userData: any) => {
  console.log('✅ Email verification successful:', userData);

  // CRITICAL FIX: Check if userData has the expected structure
  if (userData.token && userData.user) {
    // Store in localStorage
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    
    // Navigate immediately
    setShowEmailOTPVerification(false);
    
    // Force a page reload to trigger AuthContext initialization
    // This is a quick fix for the auth state issue
    window.location.href = '/HomePage';
    
    // OR use navigate if you prefer no reload
    // navigate('/HomePage');
  } else {
    console.error('❌ UserData missing token or user:', userData);
    setError('Verification successful but user data is incomplete. Please login.');
    setTimeout(() => {
      setShowEmailOTPVerification(false);
      navigate('/auth/login');
    }, 2000);
  }
};

const handleGoogleVerificationSuccess = (userData: any) => {
  console.log('✅ Google email verification successful:', userData);
  
  if (userData.token && userData.user) {
    // Store in localStorage
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    
    // Navigate immediately
    setShowGoogleOTPVerification(false);
    
    // Force a page reload to trigger AuthContext initialization
    window.location.href = '/HomePage';
  } else {
    console.error('❌ Google userData missing token or user:', userData);
    setError('Google verification successful but user data is incomplete. Please login.');
    setTimeout(() => {
      setShowGoogleOTPVerification(false);
      navigate('/auth/login');
    }, 2000);
  }
};

  
  const isFormValid = () => {
    return (
      formData.firstName.length >= 2 &&
      formData.lastName.length >= 2 &&
      formData.username.length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword
    );
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-indigo-50">
        {/* Left Side - Hero Section */}
        <div className="relative w-full lg:w-1/2 flex-1 overflow-hidden">
          <img 
            src={registerImage} 
            alt="Register" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/80 via-purple-900/60 to-pink-900/40"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 lg:px-12 py-12">
            <div className="max-w-lg">
              <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
                <Code2 className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-white text-4xl lg:text-5xl font-bold mb-6 drop-shadow-2xl leading-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">CodeTranslator</span>
              </h1>
              <p className="text-indigo-100 text-lg lg:text-xl mb-8 drop-shadow-md leading-relaxed">
                Instantly translate code between 20+ programming languages with AI-powered precision
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Check size={20} />
                  </div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Check size={20} />
                  </div>
                  <span>Free tier available</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Check size={20} />
                  </div>
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Check size={20} />
                  </div>
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="relative w-full max-w-md">
            {/* Success Messages */}
            {success && (
              <div className="absolute -top-20 left-0 right-0 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl shadow-lg animate-slideDown">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                  <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
            
            {/* General Error Messages (not field-specific) */}
            {error && !usernameError && !emailError && (
              <div className="absolute -top-20 left-0 right-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-lg animate-slideDown">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-500">
                  Join thousands of developers using CodeTranslator
                </p>
              </div>

              <form ref={formRef} onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User size={14} />
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      disabled={isLoading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User size={14} />
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      disabled={isLoading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User size={14} />
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="johndoe123"
                    value={formData.username}
                    onChange={handleChange('username')}
                    disabled={isLoading}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50 ${
                      usernameError 
                        ? 'border-red-500 focus:ring-red-500 input-error-pulse' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  
                  {/* Username-specific error message */}
                  {usernameError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{usernameError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={14} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled={isLoading}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50 ${
                      emailError 
                        ? 'border-red-500 focus:ring-red-500 input-error-pulse' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  
                  {/* Email-specific error message */}
                  {emailError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{emailError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock size={14} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange('password')}
                      disabled={isLoading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-400 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock size={14} />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      disabled={isLoading}
                      className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 hover:border-indigo-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Passwords do not match</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid() || isLoading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size={20} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Create Account
                    </>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width="100%"
                    shape="rectangular"
                    text="continue_with"
                    logo_alignment="left"
                  />
                  {googleLoading && (
                    <div className="mt-2 text-center">
                      <LoadingSpinner size={20} />
                      <span className="text-sm text-gray-500 ml-2">Connecting to Google...</span>
                    </div>
                  )}
                </div>

                <p className="text-center text-gray-600 text-sm pt-4">
                  Already have an account?{' '}
                  <Link 
                    to="/auth/login" 
                    className="font-medium text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Modals */}
        <OTPVerificationModal
          isOpen={showEmailOTPVerification}
          onClose={() => setShowEmailOTPVerification(false)}
          email={emailOTPEmail}
          onVerificationSuccess={handleEmailVerificationSuccess}
          onResendOtp={handleResendEmailOTP}
          otpTimer={otpTimer}
          type="email"
        />

        <OTPVerificationModal
          isOpen={showGoogleOTPVerification}
          onClose={() => setShowGoogleOTPVerification(false)}
          email={googleEmail}
          onVerificationSuccess={handleGoogleVerificationSuccess}
          onResendOtp={handleResendGoogleOTP}
          otpTimer={otpTimer}
          type="google"
        />

        {showAlreadyRegistered && alreadyRegisteredInfo && (
          <AlreadyRegisteredModal
            isOpen={showAlreadyRegistered}
            onClose={() => setShowAlreadyRegistered(false)}
            provider={alreadyRegisteredInfo.provider}
            email={alreadyRegisteredInfo.email}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </div>
      
      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes pulseError {
          0%, 100% { border-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
          50% { border-color: #fca5a5; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .input-error-pulse {
          animation: pulseError 0.5s ease-in-out;
        }
      `}</style>
    </GoogleOAuthProvider>
  );
};

export default Register;