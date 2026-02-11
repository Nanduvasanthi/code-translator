import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

const GoogleCallback = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');
        const redirectParam = searchParams.get('redirect');

        if (errorParam) {
          throw new Error(decodeURIComponent(errorParam));
        }

        if (!token) {
          throw new Error('No authentication token received');
        }

        // Get user info using token
        const response = await fetch(`${API_URL}/google/success?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Store user data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect to appropriate page
          const redirectTo = redirectParam || '/HomePage';
          navigate(redirectTo);
        } else {
          throw new Error(data.error || 'Failed to get user info');
        }
      } catch (err) {
        console.error('Google callback error:', err);
        setError(err instanceof Error ? err.message : 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing Google sign-in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign-in Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
            >
              Back to Login
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="w-full border border-indigo-500 text-indigo-500 px-6 py-2 rounded-lg hover:bg-indigo-50 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallback;