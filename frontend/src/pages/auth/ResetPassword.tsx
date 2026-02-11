import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Lock, AlertCircle, CheckCircle, Eye, EyeOff,
  Loader2, Key, Shield
} from "lucide-react";

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

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
        console.log('🔍 Validating token:', token);
        
        if (!token) {
            setTokenValid(false);
            setError("No reset token provided.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/verify-reset-token/${token}`, {
                method: "GET",
            });
            
            console.log('🔍 Validation response status:', response.status);
            
            const data = await response.json();
            console.log('🔍 Validation response data:', data);
            
            if (response.ok && data.success) {
                setTokenValid(true);
            } else {
                setTokenValid(false);
                setError(data.message || "Invalid or expired reset token. Please request a new reset link.");
            }
        } catch (err) {
            console.error('❌ Token validation error:', err);
            setTokenValid(false);
            setError("Failed to validate reset token. Please check your connection.");
        }
    };

    validateToken();
}, [token]);

  const validatePassword = () => {
    let valid = true;
    
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }
    
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
        return;
    }

    setError("");
    setSuccess("");
    setPasswordError("");
    setConfirmPasswordError("");
    setIsLoading(true);

    try {
        console.log('🔧 [Reset Password] Submitting...');
        console.log('🔧 Token:', token);
        console.log('🔧 Password:', password);
        console.log('🔧 Confirm Password:', confirmPassword);
        
        const response = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                newPassword: password,
                confirmPassword: confirmPassword
            }),
        });

        console.log('🔧 Response status:', response.status);
        
        const data = await response.json();
        console.log('🔧 Response data:', data);
        
        if (response.ok && data.success) {
            setSuccess("Password reset successful! Redirecting to login...");
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/auth/login");
            }, 3000);
            
        } else {
            setError(data.message || "Failed to reset password. The link may have expired.");
            setTokenValid(false);
        }
        
    } catch (err: any) {
        console.error("Reset password error:", err);
        setError("Network error. Please try again.");
    } finally {
        setIsLoading(false);
    }
};

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            to="/auth/forgot-password"
            className="inline-block w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Request New Reset Link
          </Link>
          <Link 
            to="/auth/login"
            className="inline-block w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Set New Password
          </h2>
          <p className="text-gray-500">
            Create a new secure password for your account
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
                <span className="font-medium">{error}</span>
                {error.includes("expired") && (
                    <p className="text-sm mt-1">
                        <Link 
                            to="/auth/forgot-password"
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Click here to request a new reset link
                        </Link>
                    </p>
                )}
            </div>
        </div>
    </div>
)}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="w-4 h-4" /> New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                disabled={isLoading}
                className={`w-full h-12 px-4 pl-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
                  passwordError 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400'
                }`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="w-4 h-4" /> Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError("");
                }}
                disabled={isLoading}
                className={`w-full h-12 px-4 pl-10 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
                  confirmPasswordError 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400'
                }`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Key className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-sm text-red-600">{confirmPasswordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link 
              to="/auth/login" 
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;