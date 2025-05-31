// src/pages/auth/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {  useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { resetPassword, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and resetToken from navigation state
  const { email, resetToken } = (location.state || { email: '', resetToken: '' }) as { email: string; resetToken: string };

  useEffect(() => {
    clearError(); // Clear any previous errors on mount
    // Redirect if essential data (email or resetToken) is missing
    if (!email || !resetToken) {
        alert('Invalid access to password reset. Please start from the forgot password link.');
        navigate('/forgot-password');
    }
    return () => clearError(); // Clear on unmount
  }, [email, resetToken, navigate, clearError]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear form-specific error

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    try {
      const message = await resetPassword(email, resetToken, newPassword);
      alert(message); // "Password has been reset successfully."
      navigate('/login'); // Redirect to login after successful reset
    } catch (err) {
      console.error("Password reset failed:", err);
      // Error message is already set by useAuth context
    }
  };

  // Do not render the form if email or resetToken are missing (redirect handled by useEffect)
  if (!email || !resetToken) {
      return null; // Or a loading spinner, or a "redirecting" message
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;