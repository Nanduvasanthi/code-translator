// src/components/PublicRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null;

  // If authenticated, redirect to app dashboard
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // If not authenticated, show the public page
  return <>{children}</>;
};

export default PublicRoute;