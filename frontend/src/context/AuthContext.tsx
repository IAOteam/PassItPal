// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import api from '../lib/api.ts'; // Our Axios instance
import { AxiosError } from 'axios';

import {type Socket } from 'socket.io-client';
import { socket as globalSocketInstance } from '../lib/socketService';

// Define the shape of the user object from the backend
export interface User {
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
// These should match what your backend emits/expects
interface MessagePayload {
  _id: string;
  conversation: string;
  sender: { _id: string; username?: string; profilePictureUrl?: string };
  text: string;
  readBy: string[];
  createdAt: string; // Or Date
}
interface NotificationPayload {
    _id: string;
    recipient: string;
    sender?: { _id: string; username?: string; profilePictureUrl?: string };
    type: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string; // Or Date
}

// Define the shape of the AuthContext
export interface AuthContextType {
  user: User | null;
  token: string | null;
  socket: Socket | null; 
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    username ?: string; // Optional for sellers
    email: string;
    password: string;
    mobileNumber?: string; // Optional for buyers
    role: 'buyer' | 'seller';
    city: string;
    latitude?: number; // Optional
    longitude?: number; // Optional
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
  createListing: (listingData: {  // Placeholder, align with actual listing fields
    cultPassType: string;
    expiryDate: string; // Or Date
    askingPrice: number;
    originalPrice: number;
    availableCredits?: number;
    locationName: string;
    adImageBase64?: string;
  }) => Promise<string>; // Returns success message

  logout: () => Promise<void>; // Updated to be async
  requestOtp: (email: string, type: 'email' | 'mobile') => Promise<string>;
  verifyOtp: (email: string, otp: string, type: 'email' | 'mobile') => Promise<string | { resetToken: string } | null>; 
  resendOtp: (email: string, type: 'email' | 'mobile') => Promise<string>;
  forgotPasswordRequestOtp: (email: string) => Promise<string>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  setToken: (newToken: string | null) => void; // Function to update token, e.g., after refresh
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  clearError: () => void;
  sendSocketMessage: (data: { conversationId: string; text: string; recipientId: string }) => void;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your application
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // const socketRef = useRef<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [socket, setSocketState] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start as true to check local storage
  const [error, setError] = useState<string | null>(null);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  // Effect to manage Socket.IO connection

useEffect(() => {
  // let instanceCreatedAtEffectRun: Socket | null = null; // To track the instance created in this specific run for cleanup
  
  if (token && user) {
    console.log('[AuthContext] Token and User present. Managing global socket connection.');

    // If a socket instance is already in the ref and is either connected or trying to connect,
    // then this effect run should not create a new one.
    if (!globalSocketInstance.connected ) {
      console.log('[AuthContext] Global socket not connected. Setting auth and connecting.');
        // Set or update the auth token before connecting
        globalSocketInstance.auth = { token };
        globalSocketInstance.connect(); // Manually connect
} else if (
  typeof globalSocketInstance.auth === 'object' &&
  globalSocketInstance.auth !== null &&
  'token' in globalSocketInstance.auth &&
  (globalSocketInstance.auth as { token?: string }).token !== token
) {
  // If already connected but token has changed (e.g., after refresh token flow)
  // We need to disconnect and reconnect with the new token.
  console.log('[AuthContext] Token changed. Reconnecting socket with new token.');
  globalSocketInstance.disconnect();
  globalSocketInstance.auth = { token };
  globalSocketInstance.connect();
} else {
        console.log('[AuthContext] Global socket already connected with current token.');
        // Ensure the context's socket state is up-to-date
        if (socket !== globalSocketInstance) {
            setSocketState(globalSocketInstance);
        }
      }
      const handleConnect = () => {
        console.log('[AuthContext] Global socket connected:', globalSocketInstance.id);
        setSocketState(globalSocketInstance); // Set the connected instance to context state
      };

      const handleDisconnect = (reason: Socket.DisconnectReason) => {
        console.log('[AuthContext] Global socket disconnected:', globalSocketInstance.id, 'Reason:', reason);
        setSocketState(null);
      };
       // Exit, let the existing/connecting instance proceed.
     const handleConnectError = (error: Error) => {
        console.error('[AuthContext] Global socket connect_error:', globalSocketInstance.id, error.message, error);
        // globalSocketInstance.disconnect(); // It might attempt to reconnect on its own.
        setSocketState(null); // Reflect that it's not connected in our state.
        if (error.message.includes("Invalid token")) {
            console.error("[AuthContext] Server rejected socket connection due to invalid token.");
        }
      };

      const handleReceiveMessage = (message: MessagePayload) => {
        console.log('[AuthContext] Received message:', message);
        // Handle message logic
      };
      const handleNewNotification = (notification: NotificationPayload) => {
        console.log('[AuthContext] Received notification:', notification);
        // Handle notification logic
      };

      globalSocketInstance.on('connect', handleConnect);
      globalSocketInstance.on('disconnect', handleDisconnect);
      globalSocketInstance.on('connect_error', handleConnectError);
      globalSocketInstance.on('receiveMessage', handleReceiveMessage);
      globalSocketInstance.on('newNotification', handleNewNotification);

      // Cleanup function for this effect
      return () => {
        console.log('[AuthContext] useEffect cleanup for listeners. Global socket ID:', globalSocketInstance.id);
        // Remove listeners to prevent memory leaks and multiple handlers
        // if the effect runs again (e.g., user logs out and back in).
        globalSocketInstance.off('connect', handleConnect);
        globalSocketInstance.off('disconnect', handleDisconnect);
        globalSocketInstance.off('connect_error', handleConnectError);
        globalSocketInstance.off('receiveMessage', handleReceiveMessage);
        globalSocketInstance.off('newNotification', handleNewNotification);

        // Do NOT disconnect the globalSocketInstance here if the user is still logged in
        // and token/user haven't changed to null. The disconnection for logout
        // will be handled by the 'else' block or the logout function.
        // This cleanup is primarily for the listeners attached in *this run* of the effect.
      };

    } else {
      // No token or user, so if the global socket is connected, disconnect it.
      if (globalSocketInstance.connected) {
        console.log('[AuthContext] No token/user. Disconnecting global socket.');
        globalSocketInstance.disconnect();
      }
      if (socket !== null) { // 'socket' is the context state variable
        setSocketState(null); // Ensure context state is also null
      }
    }
  }, [token, user, socket]); 
// useEffect(() => {
//  let effectSocketInstance: Socket | null = null;// To track the instance created in this specific run for cleanup
//   const hasValidAuth = Boolean(token && user);
//   if (!hasValidAuth) {
//       if (socketRef.current) {
//         console.log('[AuthSocket] No auth. Disconnecting existing socket.');
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       if (socket !== null) setSocket(null);
//       return;
//     }
//     if (socketRef.current?.connected) {
//       console.log('[AuthSocket] Reusing existing connected socket:', socketRef.current.id);
//       if (socket !== socketRef.current) {
//         setSocket(socketRef.current);
//       }
//       return;
//     }

//     if (socketRef.current) {
//       console.log('[AuthSocket] Disconnecting stale socket:', socketRef.current.id);
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }

//     if (socket !== null) setSocket(null);

//     const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api').replace('/api', '');

//     console.log('[AuthSocket] Creating new socket instance...');
//     effectSocketInstance = io(BACKEND_URL, {
//       auth: { token },
//     });
//     socketRef.current = effectSocketInstance;

//     effectSocketInstance.on('connect', () => {
//       console.log('[AuthSocket] Connected:', effectSocketInstance!.id);
//       if (socketRef.current === effectSocketInstance) {
//         setSocket(effectSocketInstance);
//       } else {
//         console.warn('[AuthSocket] Stale socket connected. Disconnecting:', effectSocketInstance!.id);
//         effectSocketInstance.disconnect();
//       }
//     });

//      effectSocketInstance.on('disconnect', (reason: Socket.DisconnectReason) => {
//       console.log('[AuthSocket] Disconnected:', effectSocketInstance!.id, 'Reason:', reason);
//       if (socketRef.current === effectSocketInstance) {
//         socketRef.current = null;
//         setSocket(null);
//       }
//     });

//     effectSocketInstance.on('connect_error', (error: Error) => {
//       console.error('[AuthSocket] Connection error:', effectSocketInstance!.id, error.message);
//       if (socketRef.current === effectSocketInstance) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//         setSocket(null);
//       }
//     });

//     effectSocketInstance.on('receiveMessage', (msg: MessagePayload) => {
//       console.log('[AuthSocket] Message received:', msg);
//     });

//     effectSocketInstance.on('newNotification', (notification: NotificationPayload) => {
//       console.log('[AuthSocket] Notification received:', notification);
//     });

//   return () => {
//       if (effectSocketInstance) {
//         console.log('[AuthSocket] Cleanup: disconnecting socket', effectSocketInstance.id);
//         effectSocketInstance.disconnect();
//         if (socketRef.current === effectSocketInstance) {
//           socketRef.current = null;
//           setSocket(null);
//         }
//       }
//     };
//   }, [token, user]);
// If this still causes issues, we might need to manage the setSocket(null)


  // Effect to load user and token from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    // Token is already initialized from localStorage by useState
    if (token && storedUser) {
        try {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('user');
            setToken(null); // Clear token if user parsing fails
        }
    } else if (token && !storedUser) {
        // If token exists but no user, attempt to fetch profile
        // This scenario should ideally be handled by a dedicated function or an initial app load check
        // For now, clearing the token if user data is missing ensures a clean state for re-login.
        console.warn("Token found but no user data, attempting to fetch profile or clearing token.");
        // Example: fetchUserProfile(token).then(setUser).catch(() => setToken(null));
        // For simplicity now, we're not auto-fetching profile here, relying on existing logic.
        // If the app structure ensures user is always set when token is, this branch might not be hit often.
    }
    setLoading(false);
  }, [token, setToken]); // Depend on token and setToken

  const clearError = () => setError(null);

  const handleApiError = (err: unknown, defaultMessage: string) => {

    if (err instanceof AxiosError) {
      const errorMessage = err.response?.data?.message || defaultMessage;
      setError(errorMessage);
      console.error(`Error: ${err.message || defaultMessage}`, err);
      return err.message || defaultMessage;
    } else {
      setError(defaultMessage);
      console.error(`Unexpected Error: ${defaultMessage}`, err);
      return defaultMessage;
    }
  };

  // --- Authentication Functions  ---

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', credentials);
      const { token: accessToken, user: userData } = res.data;
      setUser(userData);
      setToken(accessToken);

      localStorage.setItem('user', JSON.stringify(userData));
      console.log("Login successful:", userData);
    } catch (err) {
      handleApiError(err, 'Login failed');
      throw err;
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

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/logout'); // Call the backend logout endpoint
      // The backend will clear the HttpOnly refresh token cookie.
    } catch (err) {
      // Even if backend logout fails, proceed to clear client-side state
      console.error("Error calling backend logout, proceeding with client-side logout:", err);
      handleApiError(err, 'Logout failed on server, but client cleared.');
    } finally {
      setUser(null);
      setToken(null); // This clears access token from state and localStorage
      localStorage.removeItem('user');

      if (socket) { // Disconnect socket on logout
        console.log("Frontend: Disconnecting socket on logout.");
        socket.disconnect();
        setSocketState(null);
      }
      // No need to manually clear refresh token cookie from client-side JS, it's HttpOnly
      console.log("Logged out from client-side.");
      setLoading(false);
      // Optional: Redirect to home or login page
      // window.location.href = '/login'; // Or use useNavigate if within Router context
    }
  };
  const sendSocketMessage = useCallback((data: { conversationId: string; text: string; recipientId: string }) => {
    if (socket) {
      socket.emit('sendMessage', data);
      console.log("Emitted sendMessage via socket:", data);
    } else {
      console.error("Socket not connected. Cannot send message.");
      // Optionally, you could queue the message or show an error to the user.
    }
  }, [socket]);
  
  const requestOtp = async (email: string, type: 'email' | 'mobile') => {
    setLoading(true);
    setError(null);
    try {
      // Backend now expects { email, type }
      const res = await api.post('/auth/request-otp', { email, type });
      setLoading(false);
      return res.data.message;
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to request OTP'));
    }
  };


  const verifyOtp = async (email: string, otp: string, type: 'email' | 'mobile') => {
    setLoading(true);
    setError(null);
    try {
      // Backend now expects { email, otp, type }
      // The 'purpose' (verification vs password_reset) is determined by which flow initiated this.
      // For simplicity, we assume the backend's /verify-otp can handle both,
      // or you might have separate endpoints like /verify-email-otp and /verify-password-reset-otp.
      // Let's assume the backend /auth/verify-otp is smart enough or it's for general verification.
      // If it's for password reset, the component calling this should handle the resetToken.
      const res = await api.post('/auth/verify-otp', { email, otp, type });
      setLoading(false);

      // The backend's /verify-otp might return different structures based on success
      // For password reset, it returns { resetToken: "..." }
      // For email/mobile verification, it returns { message: "..." }
      // This function needs to accommodate that.
      if (res.data.resetToken) {
        return { resetToken: res.data.resetToken };
      }
      // If user was verified, update user state
      if (user && res.data.message && res.data.message.toLowerCase().includes('verified successfully')) {
          const updatedUser = { ...user };
          if (type === 'email') updatedUser.isEmailVerified = true;
          if (type === 'mobile') updatedUser.isMobileVerified = true;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return res.data.message;
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'OTP verification failed'));
    }
  };


  const resendOtp = async (email: string, type: 'email' | 'mobile') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/resend-otp', { email, type });
      setLoading(false);
      return res.data.message;
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
      return res.data.message;
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
      return res.data.message;
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to reset password'));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      setLoading(false);
      return res.data.message;
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to change password'));
    }
  };

  const updateProfile = async (profileData: Parameters<AuthContextType['updateProfile']>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/users/profile', profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setLoading(false);
      return res.data.message;
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to update profile'));
    }
  };

const createListing = async (listingData: { 
    cultPassType: string;
    expiryDate: string; // Or Date
    askingPrice: number;
    originalPrice: number;
    availableCredits?: number;
    locationName: string;
    adImageBase64?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/listings', listingData);
      setLoading(false);
      return res.data.message || 'Listing created successfully!';
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to create listing'));
    }
  };


  const authContextValue: AuthContextType = {
    user,
    token, // Access token
    socket,
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
    setToken, // Expose setToken
    setUser,
    clearError,
    sendSocketMessage,
  };
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
//  export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };