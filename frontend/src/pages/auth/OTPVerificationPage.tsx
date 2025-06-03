
import React, { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const OTP_LENGTH = 6; 

const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const { verifyOtp, resendOtp, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Refs for input elements

  const { email, purpose, type } = (location.state || {
    email: '',
    purpose: 'verification', // Default purpose
    type: 'email',       // Default type
  }) as { email: string; purpose: 'verification' | 'password_reset'; type: 'email' | 'mobile' };

  // Redirect if already authenticated, or if no email/purpose provided and it's essential
  useEffect(() => {
    if (isAuthenticated && purpose === 'verification') {
      navigate('/dashboard'); // If user is logged in and purpose was verification, redirect to dashboard
    }
    // If no email is provided, redirect to login as OTP verification needs an email
    if (!email) {
      navigate('/login', { state: { message: "Email missing for OTP verification. Please start over." }})
      // No need for alert here, as the component will not render the form.
      // Alternatively, here could render a message prompting them to go to the correct page
    }
  }, [isAuthenticated, navigate, email, purpose]);

  // Clear error message when component mounts or unmounts
  useEffect(() => {
    clearError();
    // Focus the first input on mount if email is present
    if (email && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
    return () => clearError(); // Cleanup on unmount
  }, [clearError, email]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // If a digit is entered and it's not the last input, focus next input
    if (value && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (newOtp[index] === '' && index > 0 && inputRefs.current[index - 1]) {
        // If current input is empty and backspace is pressed, focus previous input
        inputRefs.current[index - 1]?.focus();
        // Optionally, clear the previous input as well or just focus
        // newOtp[index - 1] = ''; // Uncomment if you want to clear previous on backspace to it
      } else {
        // If current input has a value, clear it
        newOtp[index] = '';
        setOtp(newOtp);
        // Focus on the current input after clearing, allowing user to re-enter or backspace again to move
        inputRefs.current[index]?.focus();
      }
      // Prevent default backspace behavior (like navigating back in browser) if needed
      // e.preventDefault(); // Use cautiously
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, OTP_LENGTH);
    if (pastedData && /^\d+$/.test(pastedData)) { // Check if it's all digits
      const newOtp = new Array(OTP_LENGTH).fill('');
      for (let i = 0; i < pastedData.length; i++) {
        if (i < OTP_LENGTH) {
          newOtp[i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      // Focus the next empty input or the last input
      const firstEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = firstEmptyIndex === -1 ? OTP_LENGTH - 1 : Math.min(firstEmptyIndex, OTP_LENGTH -1);
      if(inputRefs.current[focusIndex]){
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length !== OTP_LENGTH) {
      alert(`OTP must be ${OTP_LENGTH} digits long.`);
      return;
    }

    try {
      const result = await verifyOtp(email, finalOtp, type);

      // Explicitly check for null before proceeding
      if (result === null) {
        // This case should ideally not happen if verifyOtp throws on failure
        // It might signify an unexpected scenario, e.g., verification succeeded but yielded no meaningful data.
        alert('OTP verification succeeded but no clear outcome. Please try logging in or resetting password again.');
        return;
      }

      if (typeof result === 'object' && 'resetToken' in result && result.resetToken) {
        // This case handles password reset OTP verification success
        navigate('/reset-password', { state: { email, resetToken: result.resetToken } });
        alert('OTP verified! Please set your new password.');
      } else if (typeof result === 'string') {
        alert(result); // Show success message (e.g., "OTP verified.")
        if (purpose === 'verification') { // Assuming purpose state is reliable here
          navigate('/login');
        }
      } else {
        // Fallback if result is not a string and not a resetToken object
        alert('OTP verification status unclear. Please try logging in.');
        if (purpose === 'verification') navigate('/login');
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      // Error message is already set by useAuth context
    }
  };

  const handleResendOtp = async () => {
    try {
      const message = await resendOtp(email, type/*, purpose */);
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
                <Button onClick={() => navigate(purpose === 'password_reset' ? '/forgot-password' : '/register')}>
                  Go Back
                </Button>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="otp-input" className="sr-only">OTP</Label> {/* For accessibility, main label */}
            <div className="flex justify-center space-x-2" id="otp-input">
              {otp.map((data, index) => {
                return (
                  <Input
                    key={index}
                    type="text" // Use text to allow single char and easier control
                    name="otp"
                    maxLength={1}
                    className="w-12 h-12 md:w-14 md:h-14 text-center text-lg md:text-xl border-input focus:border-primary focus:ring-primary dark:bg-neutral-800 dark:text-white"
                    value={data}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target, index)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    onPaste={index === 0 ? handlePaste : undefined} // Attach paste handler only to the first input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    autoComplete="off"
                  />
                );
              })}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading || otp.join('').length !== OTP_LENGTH}>
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