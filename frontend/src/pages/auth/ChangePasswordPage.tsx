// frontend/src/pages/auth/ChangePasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const ChangePasswordPage: React.FC = () => {
  const { user, changePassword, loading } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  // Check if the user is a Google-only user (has a googleId but no local password set yet)
  const isGoogleUserSettingPassword = !!user?.googleId; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match.');
      setIsError(true);
      return;
    }
    // NOTE: In a real app, need to call a different backend endpoint for "set-password" vs "change-password".
    // For now,  use the existing one and just skip the currentPassword if it's a Google user.
    // backend 'changePassword' controller needs to be adapted to handle this case.
    try {
      // This assumes your `changePassword` function can handle an empty `currentPassword` for Google users
      const successMessage = await changePassword(currentPassword, newPassword);
      setMessage(successMessage || 'Password set/changed successfully!');
      setIsError(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password.');
      setIsError(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-600">
        <h2 className="text-2xl font-bold text-center dark:text-white">
          {isGoogleUserSettingPassword ? 'Set Your Password' : 'Change Your Password'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- Conditionally render the "Current Password" field --- */}
          {!isGoogleUserSettingPassword && (
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
          )}
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;