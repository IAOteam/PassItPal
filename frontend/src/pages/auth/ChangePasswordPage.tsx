import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAuthStore from '@/hooks/zustand/useAuthStore';
import { AlertTriangle } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';

const ChangePasswordPage: React.FC = () => {
    const { user, changePassword, loading } = useAuthStore();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        try {
            const message = await changePassword({ currentPassword, newPassword });
            alert(message); // Or use a toast notification
            navigate('/profile');
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        }
    };
    
    if (user?.authProvider === 'google') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-900">
                <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-neutral-800 rounded-lg shadow-md text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password Management Not Available</h2>
                    <p className="text-gray-600 dark:text-neutral-300">
                        You have signed in using your Google account. Password changes can be managed directly through Google.
                    </p>
                    <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-900">
            <div className="container mx-auto py-12 px-4 max-w-3xl">
        <BackButton />
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Change Your Password</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
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
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <div className="text-center text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                            Forgot current password?
                        </Link>
                    </div>
                </form>
            </div>
            </div>
            
        </div>
    );
};

export default ChangePasswordPage;
