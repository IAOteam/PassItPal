// src/pages/auth/ForgotPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const { forgotPasswordRequestOtp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError(); // Clear any previous errors on mount
    return () => clearError(); // Clear on unmount
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const message = await forgotPasswordRequestOtp(email);
      alert(message); // "If a user with that email exists, an OTP has been sent."
      // After requesting OTP, navigate to the OTP verification page
      // Pass the email and purpose to the OTP verification page
      navigate('/verify-otp', { state: { email, purpose: 'password_reset', type: 'email' } });
    } catch (err) {
      console.error("Forgot password request failed:", err);
      // Error message is already set by useAuth context
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Forgot Password</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;