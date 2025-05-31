// src/pages/auth/ChangePasswordPage.tsx
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const { changePassword, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); // Clear previous messages
    setIsError(false); // Clear previous error state

    if (newPassword !== confirmNewPassword) {
      setMessage('New password and confirmation do not match.');
      setIsError(true);
      return;
    }

    if (newPassword.length < 6) { // Client-side check, assuming backend has similar
      setMessage('New password must be at least 6 characters long.');
      setIsError(true);
      return;
    }

    if (currentPassword === newPassword) {
        setMessage('New password cannot be the same as the current password.');
        setIsError(true);
        return;
    }


    try {
      const successMessage = await changePassword(currentPassword, newPassword);
      setMessage(successMessage || 'Password changed successfully!');
      setIsError(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      // Optionally, redirect to dashboard or show success message for a few seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); // Redirect after 2 seconds
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        setMessage((err as { message: string }).message);
      } else {
        setMessage('Failed to change password. Please try again.');
      }
      setIsError(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 text-sm rounded border ${isError ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
              {message}
            </div>
          )}
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
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
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;