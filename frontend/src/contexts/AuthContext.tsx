// src/contexts/AuthContext.tsx - UPDATED WITH STATE MANAGEMENT
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import axios from 'axios';

// Interfaces
interface SignUpData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface VerifyOtpData {
  userId: string;
  otp: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ResendOtpData {
  userId: string;
  email: string;
}

interface ContinueWithEmailData {
  email: string;
  name?: string;
  userId?: string;
}

interface VerifyContinuationOtpData {
  userId: string;
  otp: string;
}

interface ResendContinuationOtpData {
  email: string;
}

// Add User interface
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isVerified: boolean;
  provider?: string;
}

// Update AuthContextProps to include state
interface AuthContextProps {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Original methods
  signUp: (data: SignUpData) => Promise<{ 
    userId?: string; 
    message?: string; 
    error?: string;
    userExists?: boolean;
    provider?: string;
    existingProvider?: string;
  }>;
  verifyOtp: (data: VerifyOtpData) => Promise<{ 
    success?: boolean; 
    token?: string; 
    user?: any; 
    message?: string; 
    error?: string 
  }>;
  login: (data: LoginData) => Promise<{ token?: string; error?: string }>;
  signInWithGoogle: () => Promise<{ 
    token?: string;
    userInfo?: any;
    accessToken?: string;
    tokenId?: string;
    needsVerification?: boolean;
    userId?: string;
    email?: string;
    name?: string;
    error?: string;
  }>;
  resendOtp: (data: ResendOtpData) => Promise<{ success?: boolean; error?: string }>;

  // New methods for Google + Email Verification
  continueWithEmail: (data: ContinueWithEmailData) => Promise<{ userId?: string; message?: string; error?: string }>;
  verifyContinuationOtp: (data: VerifyContinuationOtpData) => Promise<{ 
    success?: boolean; 
    token?: string; 
    user?: any;
    error?: string;
  }>;
  resendContinuationOtp: (data: ResendContinuationOtpData) => Promise<{ success?: boolean; error?: string }>;

  // Logout method
  logout: () => void;
  
  // Check if token is valid
  checkAuth: () => Promise<boolean>;

  // Deprecated phone methods
  googleWithPhone?: (data: any) => Promise<{ sessionId?: string; error?: string }>;
  verifyPhoneOtp?: (data: any) => Promise<{ user?: any; token?: string; error?: string }>;
  resendPhoneOtp?: (data: any) => Promise<{ success?: boolean; error?: string }>;
  checkPhone?: (data: any) => Promise<{ available?: boolean; error?: string }>;

  isGoogleLoaded: boolean;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // State variables
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Set axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Load Google API Script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is missing! Check your .env file');
      return;
    }

    if ((window as any).google?.accounts?.oauth2) {
      setIsGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = 'google-oauth-script';
    
    script.onload = () => setIsGoogleLoaded(true);
    script.onerror = () => setIsGoogleLoaded(false);

    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('google-oauth-script');
      if (existing) document.head.removeChild(existing);
    };
  }, [GOOGLE_CLIENT_ID]);

  // Helper function to update auth state
  const updateAuthState = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  // 1️⃣ Register user and send OTP
  const signUp = async (data: SignUpData) => {
    try {
      const res = await axios.post(`${API_URL}/register`, data);
      if (res.data.success) {
        return { userId: res.data.userId, message: res.data.message };
      } else {
        return { 
          error: res.data.error || 'Registration failed',
          userExists: res.data.userExists,
          provider: res.data.provider,
          existingProvider: res.data.existingProvider
        };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Sign up failed. Please try again.';
      return { 
        error: errorMessage,
        userExists: err.response?.data?.userExists,
        provider: err.response?.data?.provider
      };
    }
  };

  // 2️⃣ Verify OTP
  const verifyOtp = async (data: VerifyOtpData) => {
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, data);
      if (res.data.success) {
        // Update auth state
        updateAuthState(res.data.token, res.data.user);
        return { 
          success: true, 
          token: res.data.token, 
          user: res.data.user, 
          message: res.data.message 
        };
      } else {
        return { error: res.data.error || 'OTP verification failed' };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'OTP verification failed. Please try again.';
      return { error: errorMessage };
    }
  };

  // 3️⃣ Email/Password Login
  const login = async (data: LoginData) => {
    try {
      const res = await axios.post(`${API_URL}/login`, data);
      if (res.data.token) {
        updateAuthState(res.data.token, res.data.user);
        return { token: res.data.token };
      }
      return { error: res.data.error || 'Login failed' };
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Login failed' };
    }
  };

  // 4️⃣ Resend OTP
  const resendOtp = async (data: ResendOtpData) => {
    try {
      const res = await axios.post(`${API_URL}/resend-otp`, data);
      return { success: res.data.success };
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Failed to resend OTP' };
    }
  };

  // 5️⃣ Google Sign-In
  const signInWithGoogle = async (): Promise<{
    token?: string;
    userInfo?: any;
    accessToken?: string;
    tokenId?: string;
    needsVerification?: boolean;
    userId?: string;
    email?: string;
    name?: string;
    error?: string;
  }> => {
    if (!isGoogleLoaded || !GOOGLE_CLIENT_ID) {
      return { error: 'Google API not ready or Client ID missing' };
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) return { error: 'Google API not loaded properly' };

    return new Promise((resolve) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'select_account consent',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) return resolve({ error: tokenResponse.error });

          let userInfo = null;
          if (tokenResponse.access_token) {
            try {
              const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              userInfo = userRes.data;
            } catch {}
          }

          try {
            const res = await axios.post(`${API_URL}/google`, {
              accessToken: tokenResponse.access_token,
              tokenId: tokenResponse.id_token
            });

            if (res.data.success) {
              if (res.data.needsVerification) {
                resolve({
                  userInfo,
                  accessToken: tokenResponse.access_token,
                  tokenId: tokenResponse.id_token,
                  needsVerification: true,
                  userId: res.data.userId,
                  email: res.data.email,
                  name: res.data.name
                });
              } else if (res.data.token) {
                updateAuthState(res.data.token, res.data.user);
                resolve({
                  token: res.data.token,
                  userInfo,
                  accessToken: tokenResponse.access_token,
                  tokenId: tokenResponse.id_token
                });
              }
            } else {
              resolve({ error: res.data.error || 'Authentication failed' });
            }
          } catch (err: any) {
            resolve({ error: err.response?.data?.error || 'Failed to authenticate with server' });
          }
        }
      });

      client.requestAccessToken();
    });
  };

  // 6️⃣ Continue with Email (for Google users)
  const continueWithEmail = async (data: ContinueWithEmailData) => {
    try {
      const res = await axios.post(`${API_URL}/continue-with-email`, data);
      return { userId: res.data.userId, message: res.data.message };
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Failed to send verification email' };
    }
  };

  // 7️⃣ Verify Continuation OTP
  const verifyContinuationOtp = async (data: VerifyContinuationOtpData) => {
    try {
      const res = await axios.post(`${API_URL}/verify-continuation-otp`, data);
      if (res.data.success && res.data.token) {
        updateAuthState(res.data.token, res.data.user);
        return { success: true, token: res.data.token, user: res.data.user };
      }
      return { error: res.data.error || 'Verification failed' };
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Verification failed' };
    }
  };

  // 8️⃣ Resend Continuation OTP
  const resendContinuationOtp = async (data: ResendContinuationOtpData) => {
    try {
      const res = await axios.post(`${API_URL}/resend-otp`, { email: data.email });
      return { success: res.data.success };
    } catch (err: any) {
      return { error: err.response?.data?.error || 'Failed to resend verification email' };
    }
  };

  // 9️⃣ Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear Google session if exists
    if ((window as any).google?.accounts?.oauth2) {
      (window as any).google.accounts.oauth2.revoke();
    }
  };

  // 🔟 Check Authentication
  const checkAuth = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        logout();
        return false;
      }

      // Verify token with backend
      const res = await axios.get(`${API_URL}/verify-token`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      if (res.data.valid) {
        // Token is valid, update state
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
      return false;
    }
  };

  // Deprecated phone methods
  const googleWithPhone = async () => ({ error: 'Phone verification deprecated' });
  const verifyPhoneOtp = async () => ({ error: 'Phone verification deprecated' });
  const resendPhoneOtp = async () => ({ error: 'Phone verification deprecated' });
  const checkPhone = async () => ({ error: 'Phone verification deprecated' });

  return (
    <AuthContext.Provider value={{
      // State
      user,
      token,
      isAuthenticated,
      isLoading,
      
      // Methods
      signUp,
      verifyOtp,
      login,
      signInWithGoogle,
      resendOtp,
      continueWithEmail,
      verifyContinuationOtp,
      resendContinuationOtp,
      logout,
      checkAuth,
      googleWithPhone,
      verifyPhoneOtp,
      resendPhoneOtp,
      checkPhone,
      isGoogleLoaded
    }}>
      {children}
    </AuthContext.Provider>
  );
};