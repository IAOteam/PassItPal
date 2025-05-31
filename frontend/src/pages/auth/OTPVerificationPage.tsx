
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, resendOtp, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { email, purpose, type } = (location.state || {
    email: '',
    purpose: 'verification',
    type: 'email',
  }) as { email: string; purpose: 'verification' | 'password_reset'; type: 'email' | 'mobile' };

  // Redirect if already authenticated, or if no email/purpose provided and it's essential
  useEffect(() => {
    if (isAuthenticated && purpose === 'verification') {
      navigate('/dashboard'); // If user is logged in and purpose was verification, redirect to dashboard
    }
    // If no email is provided, redirect to login as OTP verification needs an email
    if (!email) {
      navigate('/login');
      // No need for alert here, as the component will not render the form.
      // Alternatively, here could render a message prompting them to go to the correct page
    }
  }, [isAuthenticated, navigate, email, purpose]);

  // Clear error message when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError(); // Cleanup on unmount
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyOtp(email, otp, type, purpose);

      // Explicitly check for null before proceeding
      if (result === null) {
        // This case should ideally not happen if verifyOtp throws on failure
        // It might signify an unexpected scenario, e.g., verification succeeded but yielded no meaningful data.
        alert('OTP verification succeeded but no clear outcome. Please try logging in or resetting password again.');
        return;
      }

      if (typeof result === 'object' && 'resetToken' in result) {
        // This case handles password reset OTP verification success
        navigate('/reset-password', { state: { email, resetToken: result.resetToken } });
        alert('OTP verified! Please set your new password.');
      } else {
        // This case handles email/mobile verification success (result is a string message)
        alert(result); // Show success message (e.g., "OTP verified.")
        if (purpose === 'verification') {
          // For registration verification, navigate to login
          navigate('/login');
        }
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      // Error message is already set by useAuth context
    }
  };

  const handleResendOtp = async () => {
    try {
      const message = await resendOtp(email, type, purpose);
      alert(message); // e.g., "New OTP sent successfully."
    } catch (err) {
      console.error("Resend OTP failed:", err);
      // Error message is already set by useAuth context
    }
  };

  // If email is missing, render a message and button to redirect
  if (!email) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center p-8 bg-white rounded-lg shadow-md dark:bg-neutral-900">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Email Missing for OTP Verification</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please go back to the login or registration page to start the process correctly.</p>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Verify Your {type === 'email' ? 'Email' : 'Mobile'}</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">
          An OTP has been sent to <span className="font-semibold">{email}</span>. Please enter it below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Didn't receive the OTP?{' '}
          <Button variant="link" onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </Button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerificationPage;