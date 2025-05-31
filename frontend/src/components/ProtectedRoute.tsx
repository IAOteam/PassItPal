// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate,Outlet  } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  unauthorizedMessage?: string;
  // children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({  allowedRoles , unauthorizedMessage}) => {
  const { user, loading } = useAuth();

  // If still loading auth state, you might want to show a spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user data...</p>
        {/* You can replace this with a nice spinner component if you have one */}
      </div>
    );
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If user is authenticated but role is not allowed
    // Redirect to dashboard or an unauthorized page
    return <Navigate to="/dashboard" replace state={{ message: unauthorizedMessage || "You don't have permission to access this page." }} />;
  
  }
  // If not authenticated, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children (the protected component)
  return <Outlet />;
};

export default ProtectedRoute;