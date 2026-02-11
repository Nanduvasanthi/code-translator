import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Code2, Lock, Mail, AlertCircle, CheckCircle, Shield, 
  Eye, EyeOff, Sparkles, ArrowRight, AlertTriangle, Loader2, Check, Zap 
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import loginImage from "../../assets/login.jpg";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Custom loading spinner component
const LoadingSpinner = ({ size = 20 }: { size?: number }) => (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin" size={size} />
  </div>
);

// Input field component
const InputField = ({ 
  icon: Icon, 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  disabled,
  showPasswordToggle,
  onTogglePassword,
  error = false
}: any) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Icon className="w-4 h-4" /> {label}
    </label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-12 px-4 pl-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400'
        }`}
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {type === "email" ? <Mail className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
      </div>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          disabled={disabled}
        >
          {type === "password" ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  </div>
);

// Alert component
const Alert = ({ type, message, children }: { 
  type: "error" | "success" | "info", 
  message: string,
  children?: React.ReactNode,
}) => {
  const config = {
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <AlertCircle className="w-5 h-5" /> },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: <CheckCircle className="w-5 h-5" /> },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: <AlertTriangle className="w-5 h-5" /> }
  };

  return (
    <div className={`${config[type].bg} ${config[type].border} border rounded-xl p-4 mb-4 animate-fadeIn`}>
      <div className="flex items-start gap-3">
        <div className={`${config[type].text} mt-0.5`}>
          {config[type].icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${config[type].text}`}>{message}</p>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
};

// Feature Item Component
const FeatureItem = ({ icon: Icon, text }: any) => (
  <div className="flex items-center gap-3 text-white/90">
    <div className="p-2 bg-white/20 rounded-lg">
      <Check size={20} />
    </div>
    <span>{text}</span>
  </div>
);

// Get API URL
const getApiUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  let baseUrl = viteUrl;
  
  if (!baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
  }
  
  return baseUrl;
};

const API_BASE = getApiUrl();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Clear field errors when user starts typing
  useEffect(() => {
    if (emailError && email) {
      const timer = setTimeout(() => setEmailError(""), 3000);
      return () => clearTimeout(timer);
    }
    if (passwordError && password) {
      const timer = setTimeout(() => setPasswordError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [email, password, emailError, passwordError]);

  const validateForm = () => {
    let valid = true;
    
    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }
    
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }
    
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError("");
    setSuccess("");
    setEmailError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess("Login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("freshLogin", "true");
        
        // Add a slight delay for better UX
        window.location.href = "/app/dashboard";
        
      } else if (response.status === 404) {
        setEmailError("Account not found. Please register first.");
        
      } else if (response.status === 400 && data.provider === 'google') {
        setEmailError("This account was registered with Google. Please login with Google.");
        
      } else if (response.status === 403 && data.needsVerification) {
        setError("Please verify your email first. Check your inbox.");
        
      } else if (response.status === 401) {
        setPasswordError("Invalid password. Please try again.");
        
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError("");
    setEmailError("");
    setPasswordError("");

    try {
      const response = await fetch(`${API_BASE}/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess("Google login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("freshLogin", "true");
        window.location.href = "/app/dashboard";
        
        
        
      } else if (response.status === 404) {
        setEmailError("Account not found. Please register first.");
        
      } else if (response.status === 400 && data.provider === 'email') {
        setEmailError("This account is registered with email/password. Please use email login.");
        
      } else {
        setError(data.message || "Google login failed. Please try again.");
      }
      
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Network error. Please check your connection and try again.");
      
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError("");
    setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError("");
    setError("");
  };

  const isFormValid = () => {
    return email && password && !emailError && !passwordError;
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-indigo-50">
        {/* Left Side - Hero Section (Updated to match Register page) */}
        <div className="relative w-full lg:w-1/2 flex-1 overflow-hidden">
          <img 
            src={loginImage} 
            alt="Login" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/80 via-purple-900/60 to-pink-900/40"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 lg:px-12 py-12">
            <div className="max-w-lg">
              <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
                <Code2 className="w-12 h-12 text-white" />
              </div>
              
              {/* Updated Header - Cleaner like Register page */}
              <h1 className="text-white text-4xl lg:text-5xl font-bold mb-6 drop-shadow-2xl leading-tight">
                Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">CodeTranslator</span>
              </h1>
              
              {/* Clean Description */}
              <p className="text-indigo-100 text-lg lg:text-xl mb-8 drop-shadow-md leading-relaxed">
                Continue translating between 50+ programming languages with our advanced AI engine
              </p>

              {/* Stats Section - Clean layout */}
              

              {/* Feature List - Clean 2-column grid like Register */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <FeatureItem text="Enterprise security" />
                <FeatureItem text="Real-time translation" />
                <FeatureItem text="24/7 support" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="relative w-full max-w-md">
            {/* Success Message */}
            {success && (
              <div className="absolute -top-20 left-0 right-0 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl shadow-lg animate-slideDown">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* General Error Message */}
            {error && !emailError && !passwordError && (
              <div className="absolute -top-20 left-0 right-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-lg animate-slideDown">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                  <Code2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-500">
                  Sign in to continue to your dashboard
                </p>
              </div>

              {/* Field-specific error alerts */}
              {emailError && (
                <Alert type="error" message={emailError}>
                  {emailError.includes("registered with Google") && (
                    <button 
                      onClick={() => {
                        // This would trigger Google login
                        document.querySelector('button[aria-label="Sign in with Google"]')?.click();
                      }}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      Login with Google instead <ArrowRight size={14} />
                    </button>
                  )}
                  {emailError.includes("not found") && (
                    <Link 
                      to="/auth/register" 
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      Create an account <ArrowRight size={14} />
                    </Link>
                  )}
                </Alert>
              )}

              {passwordError && (
                <Alert type="error" message={passwordError} />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  icon={Mail}
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading || googleLoading}
                  error={!!emailError}
                />

                <InputField
                  icon={Lock}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading || googleLoading}
                  showPasswordToggle={true}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  error={!!passwordError}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid() || isLoading || googleLoading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size={20} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Sign in to Account
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
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

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link 
                    to="/auth/register" 
                    className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </div>
      
      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </GoogleOAuthProvider>
  );
};

export default Login;