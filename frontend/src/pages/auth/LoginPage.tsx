// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
// import { FcGoogle } from "react-icons/fc";
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); // Or any protected route you want to redirect to
    }
  }, [isAuthenticated, navigate]);

  // Clear error message when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError(); // Cleanup on unmount
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        return;
    }
    try {
      await login({ email, password });
      // Redirection handled by useEffect if login is successful
    } catch (err) {
      // Error message is set by useAuth context
      console.error("Login attempt failed:", err);
    }
  };
  const handleGoogleLogin = () => {
    // Construct the full URL to your backend's Google auth initiation route
    const googleAuthUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api'}/auth/google`;
    // Redirect the current window to this URL
    window.location.href = googleAuthUrl;
  };


   return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      
      {/* Left side: The Form */}
      <div className="flex flex-col justify-center w-full max-w-3xl px-8 sm:px-12 lg:px-20 mx-auto">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline">
             &larr; Back to Home
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Sign in to your account
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="mt-8 space-y-4 dark:text-white">
            {/* Google Login Button */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              type="button"
            >
              <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </Button>

            {/* Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-muted-foreground dark:bg-neutral-950">
                  Or continue with
                </span>
              </div>
            </div>
            
            {/* Email Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-300">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                        Forgot password?
                    </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full font-semibold bg-black text-white  dark:text-black dark:bg-white"  disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </div>
        
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: The Image/Message (from your friend's version) */}
      <div className="hidden lg:flex items-center justify-center flex-1 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-neutral-800 dark:to-neutral-900">
        <div className="max-w-sm text-center px-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome Back! 👋
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
            We're glad to have you. Let's find your next pass or a buyer for yours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage
