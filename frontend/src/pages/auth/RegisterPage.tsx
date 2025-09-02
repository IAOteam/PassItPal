import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '@/hooks/zustand/useAuthStore';
import LocationSelect from '@/components/ui/LocationSelect';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [city, setCity] = useState('');

  const { register, isAuthenticated, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    return () => clearError();
  }, [error, clearError]);

  const handleGoogleLogin = () => {
    const googleAuthUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api'}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return 'Too short';
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[!@#$%^&*]/.test(pwd)) return 'Weak';
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*]/.test(pwd)) return 'Strong';
    return 'Moderate';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const message = await register({ username, email, password, mobileNumber, role, city });
      toast.success(message || "Account created! Check your email.");
      navigate('/verify-otp', { state: { email, purpose: 'verification', type: 'email' } });
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Left side: Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-10 lg:px-20 mx-auto">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline">
            &larr; Back to Home
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              Start your journey with us.
            </p>
          </div>

          <div className="mt-8 space-y-4 dark:text-white">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              type="button"
            >
              <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-muted-foreground dark:bg-neutral-950">
                  Or Register with Email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    // placeholder="Choose a username"
                    className="placeholder-gray-400 placeholder-opacity-80"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    // placeholder="you@example.com"
                    className="placeholder-gray-400 placeholder-opacity-80"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1 col-span-1 md:col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      // placeholder="Enter your password"
                      className="placeholder-gray-400 placeholder-opacity-80 pr-10"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordStrength(getPasswordStrength(e.target.value));
                      }}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <div
                      className={`text-xs mt-1 ${
                        passwordStrength === 'Strong'
                          ? 'text-green-600'
                          : passwordStrength === 'Moderate'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}
                    >
                      Strength: {passwordStrength}
                    </div>
                  )}
                </div>

                <div className="space-y-1 col-span-1 md:col-span-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      // placeholder="Re-enter your password"
                      className="placeholder-gray-400 placeholder-opacity-80 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    // placeholder="10-digit mobile number"
                    className="placeholder-gray-400 placeholder-opacity-80"
                    pattern="[0-9]{10}"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="space-y-1 w-full">
                  <LocationSelect onSelect={setCity} className='w-full' label='City'  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'buyer' | 'seller')}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground dark:bg-black focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white dark:text-black dark:bg-white hover:opacity-90"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex items-center justify-center flex-1 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-neutral-800 dark:to-neutral-900">
        <div className="max-w-sm text-center px-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome Aboard 🚀
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
            Join a vibrant marketplace where buyers and sellers connect meaningfully.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
