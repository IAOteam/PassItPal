import React, {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import useAuthStore from '@/hooks/zustand/useAuthStore';


const OTP_LENGTH = 6;

const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const {
    verifyOtp,
    resendOtp,
    loading,
    error,
    clearError,
    isAuthenticated,
  } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { email, purpose, type } = (location.state || {
    email: '',
    purpose: 'verification',
    type: 'email',
  }) as {
    email: string;
    purpose: 'verification' | 'password_reset';
    type: 'email' | 'mobile';
  };

  useEffect(() => {
    if (isAuthenticated && purpose === 'verification' && type === 'email') {
      navigate('/dashboard');
    }
    if (!email) {
      navigate('/login', {
        state: {
          message: 'Email missing for OTP verification. Please start over.',
        },
      });
    }
  }, [isAuthenticated, navigate, email, purpose, type]);

  useEffect(() => {
    clearError();
    setTimeout(() => {
      if (email && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 0);
    return () => clearError();
  }, [clearError, email]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted || pasted.length === 0) return;

    const newOtp = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    const nextIndex = newOtp.findIndex((val) => val === '');
    const focusIndex = nextIndex === -1 ? OTP_LENGTH - 1 : nextIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length !== OTP_LENGTH) {
      alert(`OTP must be ${OTP_LENGTH} digits long.`);
      return;
    }

    try {
      const result = await verifyOtp(email, finalOtp, type , purpose);
      if (result === null) {
        alert('Unexpected OTP verification result.');
        return;
      }

      if (typeof result === 'object' && result.resetToken) {
        navigate('/reset-password', { state: { email, resetToken: result.resetToken } });
        alert('OTP verified! Please set your new password.');
      } else if (typeof result === 'string') {
        alert(result);
        if (purpose === 'verification') {
          if (type === 'mobile') {
            navigate('/profile', { state: { message: result } });
          } else {
            navigate('/login');
          }
        }
      } else {
        alert('OTP verification status unclear. Please try again.');
        if (purpose === 'verification') navigate('/login');
      }
    } catch (err) {
      console.error('OTP verification failed:', err);
    }
  };

  const handleResendOtp = async () => {
    try {
      const message = await resendOtp(email, type);
      alert(message);
    } catch (err) {
      console.error('Resend OTP failed:', err);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center bg-white shadow-md rounded-md dark:bg-neutral-900">
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Email Missing
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Please return to login or register to start the process.
          </p>
          <Button onClick={() => navigate(purpose === 'password_reset' ? '/forgot-password' : '/register')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md dark:bg-neutral-600">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Verify Your {type === 'email' ? 'Email' : 'Mobile'}
        </h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the OTP sent to <span className="font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 md:gap-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete="one-time-code"
                value={digit}
                className="w-12 h-12 md:w-14 md:h-14 text-center text-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-white"
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                onFocus={(e) => e.target.select()}
                ref={(el) => (inputRefs.current[index] = el)}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.join('').length !== OTP_LENGTH}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Didn't receive the code?{' '}
          <Button
            variant="link"
            className="p-0 text-sm font-medium text-primary hover:underline"
            onClick={handleResendOtp}
            disabled={loading}
          >
            Resend OTP
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
