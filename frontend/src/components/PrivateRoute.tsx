// src/components/PrivateRoute.tsx - UPDATED VERSION
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean; // Add this if you want to require email verification
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requireVerification = false 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    checkAuth 
  } = useAuth();
  
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log('🔐 [PrivateRoute] Authentication State:', {
      isAuthenticated,
      isLoading,
      user: user ? { 
        email: user.email, 
        isVerified: user.isVerified,
        provider: user.provider 
      } : null,
      pathname: location.pathname
    });
  }, [isAuthenticated, isLoading, user, location.pathname]);

  // Check auth on mount if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log('🔐 [PrivateRoute] Checking auth...');
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  // Check if user needs verification
  if (requireVerification && user && !user.isVerified) {
    console.log('🔐 [PrivateRoute] User not verified, redirecting to verification');
    return <Navigate to="/auth/verify-email" state={{ from: location }} replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🔐 [PrivateRoute] Not authenticated, redirecting to login');
    
    // Save the attempted URL for redirect after login
    return <Navigate 
      to="/auth/login" 
      replace 
      state={{ 
        from: location,
        message: 'Please log in to access this page'
      }} 
    />;
  }

  console.log('✅ [PrivateRoute] Authentication successful');
  console.log('👤 [PrivateRoute] User:', {
    name: `${user?.firstName} ${user?.lastName}`,
    email: user?.email,
    isVerified: user?.isVerified,
    provider: user?.provider
  });

  return <>{children}</>;
};

export default PrivateRoute;