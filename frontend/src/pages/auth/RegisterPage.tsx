// src/pages/auth/RegisterPage.tsx
import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
// import { FcGoogle } from 'react-icons/fc';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer'); // Default role
  const { register, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState(''); 
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); // Redirect logged-in users away from register page
    }
  }, [isAuthenticated, navigate]);

  // Clear error message when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError(); // Cleanup on unmount
  }, [clearError]);

  const handleGoogleLogin = () => {
    // Construct the full URL to your backend's Google auth initiation route
    const googleAuthUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api'}/auth/google`;
    // Redirect the current window to this URL
    window.location.href = googleAuthUrl;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the register function from AuthContext
      const message = await register({ username, email, password, mobileNumber, role ,city});
      alert(message); // Show success message (e.g., "User registered. OTP sent...")

      // After successful registration (and OTP sent), navigate to OTP verification page
      // Pass email and purpose as state to OTP verification page
      navigate('/verify-otp', { state: { email, purpose: 'verification', type: 'email' } });
    } catch (err) {
      // Error message is handled and set by useAuth context
      console.error("Registration failed:", err);
    }
  };

 return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      
      {/* Left side: The Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 sm:px-12 lg:px-20 mx-auto">
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
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-300">
                  {error}
                </div>
              )}
              {/* Using grid for form layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text"  value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password"  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input id="mobileNumber" type="tel"  value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" type="text"  value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value as 'buyer' | 'seller')} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground dark:bg-black focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-black text-white  dark:text-black dark:bg-white" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </div>
        
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: The Image/Message */}
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
