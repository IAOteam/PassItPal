// frontend/src/pages/auth/GoogleAuthCallbackPage.tsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type User} from "@/context/AuthContext"
import { useAuth } from '@/hooks/useAuth';

const GoogleAuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth(); // We'll need a way to set the user directly in AuthContext

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const userString = queryParams.get('user');

    if (token && userString) {
      try {
        const userData: User = JSON.parse(userString);
        
        console.log('[GoogleCallback] Received token:', token);
        console.log('[GoogleCallback] Received user data:', userData);

        // Update AuthContext and localStorage
        setToken(token); // This function should handle localStorage for token
        
        // We need a way to set the user object in AuthContext and localStorage
        // Let's assume we'll add a direct setUser function to AuthContext or modify setToken
        // For now, let's call a hypothetical setUserAndStore function
        // We will define this in AuthContext next.
        if (setUser) { // Check if setUser is available from useAuth()
          setUser(userData); // Update user in context
          localStorage.setItem('user', JSON.stringify(userData)); // Manually set user in localStorage
        }
        
        console.log('[GoogleCallback] Authentication successful. Redirecting to dashboard.');
        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('[GoogleCallback] Error parsing user data or processing callback:', error);
        navigate('/login?error=google_auth_processing_failed', { replace: true });
      }
    } else {
      console.error('[GoogleCallback] Token or user data missing in query parameters.');
      navigate('/login?error=google_auth_missing_params', { replace: true });
    }
  }, [location, navigate, setToken, setUser]); // Add setUser to dependency array

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        Processing Google authentication...
      </p>
    </div>
  );
};

export default GoogleAuthCallbackPage;