import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mail, AlertCircle, CheckCircle, ArrowLeft,
  Loader2, Shield, Key, Lock, AlertTriangle, UserX, ShieldAlert, Globe
} from "lucide-react";
import loginImage from "../../assets/login.jpg";

// Loading spinner component
const LoadingSpinner = ({ size = 20 }: { size?: number }) => (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin" size={size} />
  </div>
);

// Professional Alert Component
const ProfessionalAlert = ({ 
  type, 
  title, 
  message, 
  suggestion,
  actionText,
  onAction,
  icon: Icon
}: { 
  type: "error" | "success" | "warning" | "info",
  title: string,
  message: string,
  suggestion?: string,
  actionText?: string,
  onAction?: () => void,
  icon?: React.ReactNode
}) => {
  const config = {
    error: { 
      bg: "bg-red-50", 
      border: "border-red-200", 
      text: "text-red-800",
      title: "text-red-900",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      defaultIcon: <ShieldAlert className="w-5 h-5" />
    },
    success: { 
      bg: "bg-emerald-50", 
      border: "border-emerald-200", 
      text: "text-emerald-800",
      title: "text-emerald-900",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      defaultIcon: <CheckCircle className="w-5 h-5" />
    },
    warning: { 
      bg: "bg-amber-50", 
      border: "border-amber-200", 
      text: "text-amber-800",
      title: "text-amber-900",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      defaultIcon: <AlertTriangle className="w-5 h-5" />
    },
    info: { 
      bg: "bg-blue-50", 
      border: "border-blue-200", 
      text: "text-blue-800",
      title: "text-blue-900",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      defaultIcon: <AlertCircle className="w-5 h-5" />
    }
  };

  const styles = config[type];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 mb-4 animate-fadeIn`}>
      <div className="flex items-start gap-3">
        <div className={`${styles.iconBg} ${styles.iconColor} p-2 rounded-lg`}>
          {Icon || styles.defaultIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${styles.title} mb-1`}>{title}</h4>
          <p className={`text-sm ${styles.text} mb-2`}>{message}</p>
          
          {suggestion && (
            <p className="text-sm text-gray-600 mb-2">{suggestion}</p>
          )}
          
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              {actionText}
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<{title: string; message: string; type: "error" | "warning" | "info"; action?: {text: string; onClick: () => void}} | null>(null);
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Clear email error when user starts typing
  useEffect(() => {
    if (emailError && email) {
      const timer = setTimeout(() => setEmailError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [email, emailError]);

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email address is required");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    setError(null);
    setSuccess("");
    setEmailError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess("Password reset email sent! Please check your inbox.");
        setIsSubmitted(true);
      } else {
        // Handle specific error cases professionally
        if (response.status === 404) {
          setError({
            title: "Account Not Found",
            message: "We couldn't find an account associated with this email address.",
            type: "warning",
            action: {
              text: "Create a new account",
              onClick: () => navigate("/auth/register")
            }
          });
        } else if (response.status === 400 && data.provider === 'google') {
          setError({
            title: "Google Account Detected",
            message: "This email is registered with Google. Please use Google Sign-In to access your account.",
            type: "info",
            action: {
              text: "Login with Google",
              onClick: () => navigate("/auth/login")
            }
          });
        } else if (response.status === 400 && data.needsVerification) {
          setError({
            title: "Email Verification Required",
            message: "Please verify your email address before resetting your password.",
            type: "warning",
            action: {
              text: "Resend verification email",
              onClick: () => {
                // You can add resend verification logic here
                console.log("Resend verification clicked");
              }
            }
          });
        } else if (response.status === 429) {
          setError({
            title: "Too Many Requests",
            message: "Please wait 15 minutes before trying again.",
            type: "warning"
          });
        } else {
          setError({
            title: "Unable to Send Email",
            message: data.message || "We encountered an issue sending the reset email. Please try again.",
            type: "error"
          });
        }
      }
      
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError({
        title: "Connection Error",
        message: "Unable to connect to the server. Please check your internet connection.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess("");
    setIsSubmitted(false);
    handleSubmit(new Event('submit') as any);
  };

  const handleGoogleLoginRedirect = () => {
    // This would trigger Google login button
    document.querySelector('button[aria-label="Sign in with Google"]')?.click();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Left Side - Hero Section */}
      <div className="relative w-full lg:w-1/2 flex-1 overflow-hidden">
        <img 
          src={loginImage} 
          alt="Forgot Password" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/80 via-purple-900/60 to-pink-900/40"></div>
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 lg:px-12 py-12">
          <div className="max-w-lg">
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
              <Shield className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-white text-4xl lg:text-5xl font-bold mb-6 drop-shadow-2xl leading-tight">
              Reset Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">Password</span>
            </h1>
            
            <p className="text-indigo-100 text-lg lg:text-xl mb-8 drop-shadow-md leading-relaxed">
              Secure your account with our password recovery system. We'll send you a reset link to your email.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Lock size={20} />
                </div>
                <span>Secure password reset</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle size={20} />
                </div>
                <span>Link expires in 1 hour</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Key size={20} />
                </div>
                <span>One-click reset process</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield size={20} />
                </div>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="relative w-full max-w-md">
          {/* Success Message */}
          {success && (
            <div className="absolute -top-24 left-0 right-0 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-lg animate-slideDown">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Email Sent Successfully!</p>
                  <p className="text-sm text-emerald-700 mt-0.5">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
            <button
              onClick={() => navigate("/auth/login")}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to login</span>
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-500">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Professional Error Display */}
            {error && (
              <ProfessionalAlert
                type={error.type}
                title={error.title}
                message={error.message}
                actionText={error.action?.text}
                onAction={error.action?.onClick}
                icon={
                  error.type === "error" ? <AlertCircle className="w-5 h-5" /> :
                  error.type === "warning" ? <AlertTriangle className="w-5 h-5" /> :
                  error.type === "info" && error.title.includes("Google") ? 
                    <Globe className="w-5 h-5" /> : 
                    <AlertCircle className="w-5 h-5" />
                }
              />
            )}

            {!isSubmitted ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">How it works</p>
                      <p className="text-sm text-blue-700">
                        Enter your email address and we'll send you a secure link to reset your password. The link will expire in 1 hour.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Mail className="w-4 h-4" /> Email address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                          setError(null);
                        }}
                        disabled={isLoading}
                        className={`w-full h-12 px-4 pl-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
                          emailError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400'
                        }`}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                    </div>
                    {emailError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 animate-fadeIn">
                        <AlertCircle className="w-4 h-4" />
                        <span>{emailError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!email || !!emailError || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size={20} />
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 text-center">
                    Don't have an account?{" "}
                    <Link 
                      to="/auth/register" 
                      className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Sign up here
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-4 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h3>
                  <p className="text-gray-600">
                    We've sent a password reset link to:
                  </p>
                  <div className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="font-medium">{email}</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-amber-900 mb-1">Important</p>
                      <p className="text-sm text-amber-700">
                        • The reset link expires in 1 hour<br />
                        • Check your spam folder if you don't see it<br />
                        • Contact support if you need assistance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="w-full h-12 border-2 border-indigo-600 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size={20} />
                        Resending...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Resend Email
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate("/auth/login")}
                    className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;