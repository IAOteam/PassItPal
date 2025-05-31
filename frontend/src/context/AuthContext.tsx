// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api.ts'; // Our Axios instance
import { AxiosError } from 'axios';

// Define the shape of the user object from the backend
interface User {
  id: string;
  email: string;
  username: string;
  role: 'buyer' | 'seller';
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  city?: string; //  as user.location?.city could be undefined/null
  mobileNumber?: string; //  as it's optional in register
  latitude?: number; //  it's from backend login response
  longitude?: number; // it's from backend login response
  profilePictureUrl?: string;
  
}

// Define the shape of the AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    mobileNumber?: string; // Optional
    role: 'buyer' | 'seller';
    city: string;
  }) => Promise<string | void>; // Returns message for OTP or void on error
  updateProfile: (profileData: {
    username?: string;
    // email?: string; // Though email change will require re-verification
    mobileNumber?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    profilePictureBase64?: string; // For base64 string upload
  }) => Promise<string | void>; // Returns message or void on error
  createListing: (listingData: {
    title: string;
    description: string;
    price: number;
    category: string; // Assuming category is a string
    condition: string; // Assuming condition is a string
    // Add other fields as per your listing model (e.g., imagesBase64: string[])
  }) => Promise<string>; // Returns success message

  logout: () => void;
  requestOtp: (email: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => Promise<string>;
  verifyOtp: (email: string, otp: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => Promise<string | { resetToken: string } | null>; // Returns message or reset token
  resendOtp: (email: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => Promise<string>;
  forgotPasswordRequestOtp: (email: string) => Promise<string>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  clearError: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your application
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start as true to check local storage
  const [error, setError] = useState<string | null>(null);

  // Effect to load user and token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        // Optionally, verify token validity with backend here if tokens can expire silently
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false); // Finished loading
  }, []);

  const clearError = () => setError(null);

  const handleApiError = (err: unknown, defaultMessage: string) => {
    if (err instanceof AxiosError) {
      const errorMessage = err.response?.data?.message || defaultMessage;
      setError(errorMessage);
      console.error(`API Error: ${errorMessage}`, err.response?.data);
      return errorMessage;
    } else {
      setError(defaultMessage);
      console.error(`Unexpected Error: ${defaultMessage}`, err);
      return defaultMessage;
    }
  };

  // --- Authentication Functions  ---

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      setUser(userData);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log("Login successful:", userData);
    } catch (err) {
      handleApiError(err, 'Login failed');
      throw err; // Re-throw to allow component to handle specific errors if needed
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Parameters<AuthContextType['register']>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      setLoading(false);
      // Backend registration now returns a message and potentially an OTP_REQUIRED flag
      // It doesn't log in the user immediately, it sends an OTP.
      return res.data.message; // "User registered. OTP sent to your email."
    } catch (err) {
      handleApiError(err, 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log("Logged out.");
    // Redirect to login page or home page
    window.location.href = '/';
  };

  const requestOtp = async (email: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/request-otp', { email, type, purpose });
      setLoading(false);
      return res.data.message; // e.g., "OTP sent successfully."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to request OTP'));
    }
  };

  const verifyOtp = async (email: string, otp: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp, type, purpose });
      setLoading(false);
      // If it's a password_reset purpose, it returns a resetToken
      if (purpose === 'password_reset' && res.data.resetToken) {
        return { resetToken: res.data.resetToken };
      }
      return res.data.message; // e.g., "OTP verified."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'OTP verification failed'));
    }
  };

  const resendOtp = async (email: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/resend-otp', { email, type, purpose });
      setLoading(false);
      return res.data.message; // e.g., "New OTP sent successfully."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to resend OTP'));
    }
  };

  const forgotPasswordRequestOtp = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/forgot-password-request-otp', { email });
      setLoading(false);
      return res.data.message; // "If a user with that email exists, an OTP has been sent."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to request password reset OTP'));
    }
  };

  const resetPassword = async (email: string, resetToken: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/auth/reset-password', { email, resetToken, newPassword });
      setLoading(false);
      return res.data.message; // "Password has been reset successfully."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to reset password'));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint requires a JWT, which Axios interceptor adds automatically if token exists
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      setLoading(false);
      return res.data.message; // "Password changed successfully."
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to change password'));
    }
  };
  const updateProfile = async (profileData: Parameters<AuthContextType['updateProfile']>[0]) => {
  setLoading(true);
  setError(null);
  try {
    const res = await api.put('/users/profile', profileData); // Endpoint is /api/users/profile
    const updatedUser = res.data.user; // Backend now returns { message, user }

    // Update user state and localStorage
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log("Profile updated successfully:", updatedUser);
    return res.data.message; // Return success message from backend
  } catch (err) {
    const errorMessage = handleApiError(err, 'Failed to update profile');
    throw new Error(errorMessage); // Throw error for component to catch
  } finally {
    setLoading(false);
  }
};

const createListing = async (listingData: Parameters<AuthContextType['createListing']>[0]) => {
  setLoading(true);
  setError(null);
  try {
    // Assuming your backend route for creating listings is POST /api/listings
    const res = await api.post('/listings', listingData);
    // No need to update local user state for listing creation directly
    return res.data.message || 'Listing created successfully!';
  } catch (err) {
    const errorMessage = handleApiError(err, 'Failed to create listing');
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const authContextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    error,
    login,
    register,
    updateProfile,
    createListing,
    logout,
    requestOtp,
    verifyOtp,
    resendOtp,
    forgotPasswordRequestOtp,
    resetPassword,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};