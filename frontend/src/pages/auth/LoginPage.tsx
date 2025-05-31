// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    try {
      await login({ email, password });
      // Redirection handled by useEffect if login is successful
    } catch (err) {
      // Error message is set by useAuth context
      console.error("Login attempt failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"> {/* Adjusted min-height */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Log in to PassItPal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;