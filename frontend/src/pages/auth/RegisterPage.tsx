// src/pages/auth/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"> {/* Adjusted min-height */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-neutral-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Create your PassItPal account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Your unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
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
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
            <Input
              id="mobileNumber"
              type="tel" // Use type="tel" for phone numbers
              placeholder="+911234567890"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>
          <div>
              <Label htmlFor="city">City</Label>
              <Input
                  id="city"
                  type="text"
                  placeholder="e.g., Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required // Make it required to match backend validation
              />
          </div>
          <div>
            <Label htmlFor="role">Account Type</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'buyer' | 'seller')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              required
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;