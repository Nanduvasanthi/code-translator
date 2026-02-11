import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect');

    if (token) {
      // Store token and redirect
      localStorage.setItem('token', token);
      
      // Fetch user info
      fetch(`${API_URL}/google/success?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(err => {
          console.error('Failed to fetch user info:', err);
        })
        .finally(() => {
          navigate(redirect || '/HomePage');
        });
    } else {
      navigate('/auth/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Finalizing Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;