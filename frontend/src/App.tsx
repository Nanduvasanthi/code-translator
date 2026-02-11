import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Auth Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword"; // Add this import
import ResetPassword from "./pages/auth/ResetPassword"; // Add this import
import VerifyEmail from "./pages/auth/VerifyEmail";
import GoogleCallback from "./pages/auth/GoogleCallback";
import GoogleSuccess from "./pages/auth/GoogleSuccess";

// Main Layout & Pages
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Translator from "./pages/Translator";
import Compiler from "./pages/Compiler";
import History from "./pages/History";
import Settings from "./pages/Settings";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Landing Page - Always accessible */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes - Only for non-authenticated users */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} /> {/* Add this line */}
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} /> {/* Add this line */}
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />
          
          {/* Protected App Routes - Only for authenticated users */}
          <Route path="/app" element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="translator" element={<Translator />} />
            <Route path="compiler" element={<Compiler />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Legacy Redirects - Keep these for backwards compatibility */}
          <Route path="/homepage" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/HomePage" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/translator" element={<Navigate to="/app/translator" replace />} />
          <Route path="/compiler" element={<Navigate to="/app/compiler" replace />} />
          <Route path="/history" element={<Navigate to="/app/history" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;