// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import api from '../lib/api.ts'; // Our Axios instance
import { AxiosError } from 'axios';

import {type Socket } from 'socket.io-client';
import { socket as globalSocketInstance } from '../lib/socketService';

// Define the shape of the user object from the backend
export interface User {
  _id: string;
  email: string;
  username: string;
  role: 'buyer' | 'seller'| 'admin';
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  city?: string; //  as user.location?.city could be undefined/null
  mobileNumber?: string; //  as it's optional in register
  latitude?: number; //  it's from backend login response
  longitude?: number; // it's from backend login response
  profilePictureUrl?: string;

  requestedRole?: 'buyer' | 'seller';                     
  roleRequestStatus?: 'pending' | 'approved' | 'rejected'; 
  roleRequestTimestamp?: Date;                             
  roleReviewNotes?: string;  
  
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
export interface Notification {
    _id: string;
    recipient: string;
    sender?: { _id: string; username?: string; profilePictureUrl?: string };
    type: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}


// Define the shape of the AuthContext
export interface AuthContextType {
  user: User | null;
  token: string | null;
  socket: Socket | null; 
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  notifications: Notification[];
  unreadCount: number;
  acceptOrder: (orderId: string) => Promise<string>; 
  rejectOrder: (orderId: string) => Promise<string>;
  getOrCreateConversation: (recipientId: string) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<string>;
  markNotificationsAsRead: () => Promise<void>;
  // refetchUser: () => Promise<void>;
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
  switchUserRole: (newRole: 'buyer' | 'seller') => Promise<string>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your application
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // const socketRef = useRef<Socket | null>(null);
  const [userState, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [socketContextState, setSocketContextState] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start as true to check local storage
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const setUser = useCallback<React.Dispatch<React.SetStateAction<User | null>>>(
  (newUser) => {
    setUserState(prevState => {
      const newUserState =
        typeof newUser === 'function'
          ? (newUser as (prev: User | null) => User | null)(prevState)
          : newUser;

      // Safe to use side effect here because we computed newUserState
      if (newUserState) {
        console.log('[AuthContext] Updating localStorage with new user data.');
        localStorage.setItem('user', JSON.stringify(newUserState));
      } else {
        localStorage.removeItem('user');
      }

      return newUserState;
    });
  },
  []
);



 
   // Effect to load user and fetch initial notifications
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      // Fetch initial notifications
      try {
        console.log("[AuthContext] Fetching initial notifications...");
        const res = await api.get('/notifications/me'); // Axios adds the token
        const fetchedNotifications: Notification[] = res.data || [];
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        console.log(`[AuthContext] Fetched ${fetchedNotifications.length} notifications, ${fetchedNotifications.filter(n => !n.read).length} unread.`);
      } catch (err) {
        console.error("Failed to fetch initial notifications:", err);
        setError("Could not load notifications.");
      }
      
      const storedUserJson = localStorage.getItem('user');
      if (storedUserJson) {
        try {
          setUserState(JSON.parse(storedUserJson));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          setUser(null); setToken(null);
        }
      }
      setLoading(false);
    };

    const initialToken = localStorage.getItem('token');
    if (initialToken) {
      loadInitialData();
    } else {
      setLoading(false); // Not authenticated, no data to load
    }
  }, [setToken, setUser]);


  useEffect(() => {
    const storedUserJson = localStorage.getItem('user');
    // const initialToken = localStorage.getItem('token'); // Already set by useState init

    if (/*initialToken */ token && storedUserJson) {
      try {
        const parsedUser: User = JSON.parse(storedUserJson);
        setUserState(parsedUser); // Use internal setter
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        // localStorage.removeItem('user');
        setUser(null);
        setToken(null); // Use context's setToken to also clear localStorage
      }
    } else if (/*initialToken*/ token && !storedUserJson) {
        // Token exists but user doesn't - might be an old session or incomplete login
        console.warn("Token found but no user data in localStorage. Clearing token to force re-login.");
        setToken(null);
    }
    setLoading(false);
  }, [token, setUser, setToken]); // setToken is stable from useCallback


  // Effect to manage Socket.IO connection
  useEffect(() => {
    console.log(`[AuthContext Socket Effect] Running. Token: ${!!token}, User: ${!!userState}, Socket Connected: ${globalSocketInstance.connected}`);

    if (token && userState) {
      // If the global socket is not connected, OR if its auth token is stale
      if (!globalSocketInstance.connected || (globalSocketInstance.auth as {token?:string}).token !== token) {
        console.log('[AuthContext Socket Effect] Conditions met to connect/reconnect.');
        // If it's already trying to connect (but not yet connected), don't issue another .connect()
        // The 'auth' property might not be updated until after a disconnect/connect cycle if token changed.
        if (globalSocketInstance.connected && (globalSocketInstance.auth as {token?:string}).token !== token) {
            console.log('[AuthContext Socket Effect] Token changed. Disconnecting global socket to reconnect with new token.');
            globalSocketInstance.disconnect(); // Disconnect first if token changed
        }
        
        // Update auth option before connecting if not connected or if token changed
        globalSocketInstance.auth = { token };
        
        if (!globalSocketInstance.connected) { // Check again after potential disconnect
            console.log('[AuthContext Socket Effect] Calling globalSocketInstance.connect()');
            globalSocketInstance.connect();
        }
      } else {
        console.log('[AuthContext Socket Effect] Global socket already connected with the current token.');
        // Ensure context state reflects the global instance if it's connected
        if (socketContextState !== globalSocketInstance) {
            setSocketContextState(globalSocketInstance);
        }
      }

      // Define listeners (these will be added once)
      const handleConnect = () => {
        console.log('[AuthContext] Global socket connected event. ID:', globalSocketInstance.id);
        setSocketContextState(globalSocketInstance);
      };
      const handleDisconnect = (reason: Socket.DisconnectReason) => {
        console.log('[AuthContext] Global socket disconnected event. ID:', globalSocketInstance.id, 'Reason:', reason);
        setSocketContextState(null);
      };
      const handleConnectError = (error: Error) => {
        console.error('[AuthContext] Global socket connect_error event. ID:', globalSocketInstance.id, error.message);
        setSocketContextState(null);
      };
      const handleReceiveMessage = (message: MessagePayload) => console.log('[AuthContext] Received message:', message);
      const handleNewNotification = (notification: Notification) => {
        console.log('[AuthContext] Received new notification via socket:', notification);
        // Add the new notification to the top of the list
        setNotifications(prev => [notification, ...prev]);
        // Increment the unread count
        setUnreadCount(prev => prev + 1);
      };

      // Add listeners
      globalSocketInstance.on('connect', handleConnect);
      globalSocketInstance.on('disconnect', handleDisconnect);
      globalSocketInstance.on('connect_error', handleConnectError);
      globalSocketInstance.on('receiveMessage', handleReceiveMessage);
      globalSocketInstance.on('newNotification', handleNewNotification);

      // Cleanup: remove these specific listeners when token/user changes or component unmounts
      return () => {
        console.log('[AuthContext Socket Effect] Cleanup: Removing listeners from global socket.');
        globalSocketInstance.off('connect', handleConnect);
        globalSocketInstance.off('disconnect', handleDisconnect);
        globalSocketInstance.off('connect_error', handleConnectError);
        globalSocketInstance.off('receiveMessage', handleReceiveMessage);
        globalSocketInstance.off('newNotification', handleNewNotification);
        // Do NOT disconnect the globalSocketInstance here generally,
        // unless the intent is to close it when AuthProvider unmounts.
        // The 'else' block below handles disconnection on logout/token loss.
      };
    } else {
      // No token or user, so if the global socket is connected, disconnect it.
      if (globalSocketInstance.connected) {
        console.log('[AuthContext Socket Effect] No token/user. Disconnecting global socket.');
        globalSocketInstance.disconnect();
      }
      // Ensure context state is also null
      if (socketContextState !== null) {
        setSocketContextState(null);
      }
    }
  }, [token, userState /*, socketContextState*/]); // Listen to socketContextState to re-sync if needed or re-attach listeners
                                           // But this could cause loops if not careful. Try [token, userState] first.
                                           // Most robust: [token, userState] and manage listeners carefully.


  const clearError = () => setError(null);

  const markNotificationsAsRead = async () => {
    // Optimistically update UI first for better UX
    const previouslyUnread = notifications.filter(n => !n.read);
    if (previouslyUnread.length === 0) return; // No unread notifications to mark

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      // Call the backend endpoint to update the database
      await api.put('/notifications/mark-all-read');
      console.log("[AuthContext] Successfully marked all notifications as read on the server.");
    } catch (err) {
      console.error("Failed to mark notifications as read on server:", err);
      // If server update fails, revert the UI changes
      setNotifications(prev => prev.map(n => 
          previouslyUnread.some(unread => unread._id === n._id) ? { ...n, read: false } : n
      ));
      setUnreadCount(previouslyUnread.length);
      setError("Could not update notification status.");
    }
  };

  const handleApiError = (err: unknown, defaultMessage: string) => {
    setLoading(false);
    if (err instanceof AxiosError) {
      const errorMessage = err.response?.data?.message || err.message || defaultMessage;
      setError(errorMessage);
      console.error(`API Error: ${errorMessage}`, err.response?.data || err);
      return errorMessage;
    } else if (err instanceof Error) {
      const errorMessage = err.message || defaultMessage;
      setError(errorMessage);
      console.error(`Error: ${errorMessage}`, err);
      return errorMessage;
    } else {
      setError(defaultMessage);
      console.error(`Unexpected Error: ${defaultMessage}`, err);
      return defaultMessage;
    }
  };

  const cancelOrder = async (orderId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/orders/${orderId}/cancel`);
      return res.data.message || 'Order cancelled successfully.';
    } catch (err) {
      // handleApiError will set the loading and error states.
      // Re-throw the error so the calling component knows it failed.
      throw new Error(handleApiError(err, 'Failed to cancel order.'));
    } finally {
      // Ensure loading is always stopped, even after an error.
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: 'accepted' });
      return res.data.message || 'Order accepted successfully.';
    } catch (err) {
      throw new Error(handleApiError(err, 'Failed to accept the order.'));
    } finally {
      setLoading(false);
    }
  };
  
  const rejectOrder = async (orderId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: 'rejected' });
      return res.data.message || 'Order rejected successfully.';
    } catch (err) {
      throw new Error(handleApiError(err, 'Failed to reject the order.'));
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (recipientId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/messages/conversations', { recipientId });
      // The backend returns an object like { conversation: { _id: '...' } }
      if (!res.data?.conversation?._id) {
          throw new Error("Could not get or create a conversation.");
      }
      return res.data.conversation._id;
    } catch (err) {
      throw new Error(handleApiError(err, 'Failed to start conversation.'));
    } finally {
      setLoading(false);
    }
  };


  const refetchUser = useCallback(async () => {
    if (!token) {
      console.warn("[refetchUser] No token available, cannot refetch.");
      return;
    }
    console.log("[refetchUser] Refetching user data from /api/users/me");
    try {
      const res = await api.get('/users/me');
      if (res.data && res.data.user) {
        setUser(res.data.user); // This updates the global state and localStorage
        console.log("[refetchUser] Successfully refetch and updated user state.");
      }
    } catch (err) {
      console.error("Failed to refetch user data:", err);
      handleApiError(err, "Could not refresh user session.");
    }
  }, [token, setUser]); // Depends on token and the stable setUser function

  // --- Authentication Functions  ---

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', credentials);
      const { token: accessToken, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);

      const notificationsRes = await api.get('/notifications/me');
      const fetchedNotifications: Notification[] = notificationsRes.data || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);

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
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      // Even if backend logout fails, proceed to clear client-side state
      console.error("Error calling backend logout, proceeding with client-side logout:", err);
      handleApiError(err, 'Logout failed on server, but client cleared.');
    } finally {
      
      setUser(null);
      setToken(null); // This clears access token from state and localStorage
      localStorage.removeItem('user');

      if (globalSocketInstance.connected) { // Disconnect socket on logout
        console.log("Frontend: Disconnecting socket on logout.");
        globalSocketInstance.disconnect();
        setSocketContextState(null);
      }
      // No need to manually clear refresh token cookie from client-side JS, it's HttpOnly
      console.log("Logged out from client-side.");
      setLoading(false);
      // Optional: Redirect to home or login page
      // window.location.href = '/login'; // Or use useNavigate if within Router context
    }
  };

  const switchUserRole = async (newRole: 'buyer' | 'seller'): Promise<string> => {
  setLoading(true);
  setError(null);
  try {
    const res = await api.post('/users/me/request-role-change', { newRole });
    // The backend now sends back the updated request status.
    // We should update the local user object to reflect this pending status immediately.
    // if (userState && res.data.requestedRole && res.data.roleRequestStatus) {
    //   const updatedUserWithRoleRequest = {
    //     ...userState,
    //     requestedRole: res.data.requestedRole,
    //     roleRequestStatus: res.data.roleRequestStatus,
    //     // roleRequestTimestamp will be set by backend, could be included in response too
    //   };
    //    setUser(updatedUserWithRoleRequest); // Update user state in context
    //    localStorage.setItem('user', JSON.stringify(updatedUserWithRoleRequest));
    // }
    await refetchUser();
    setLoading(false);
    return res.data.message || 'Role changed successfully.';
  } catch (err) {
    setLoading(false);
    // handleApiError should set the error state, which ProfilePage can then read
    throw new Error(handleApiError(err, 'Failed to submit role change request.'));
  }
};

  const sendSocketMessage = useCallback((data: { conversationId: string; text: string; recipientId: string }) => {
    if (socketContextState && socketContextState.connected) {
      socketContextState.emit('sendMessage', data);
      console.log("Emitted sendMessage via socket:", data);
    } else {
      console.error("Socket not connected. Cannot send message.");
      // Optionally, you could queue the message or show an error to the user.
    }
  }, [socketContextState]);
  
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
      if (userState && res.data.message && res.data.message.toLowerCase().includes('verified successfully')) {
          const updatedUser = { ...userState };
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
      // const updatedUser = res.data.user as User;
     
      // setUser(updatedUser);
       await refetchUser();
      // localStorage.setItem('user', JSON.stringify(updatedUser));
      // setLoading(false);
      return res.data.message || 'Profile updated successfully!';
    } catch (err) {
      // setLoading(false);
      throw new Error(handleApiError(err, 'Failed to update profile'));
    }finally {
    setLoading(false); 
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
      // setLoading(false);
      return res.data.message || 'Listing created successfully!';
    } catch (err) {
      setLoading(false);
      throw new Error(handleApiError(err, 'Failed to create listing'));
    } finally {
      setLoading(false);
    }
  };



  const authContextValue: AuthContextType = {
    user: userState,
    token, // Access token
    socket: socketContextState,
    isAuthenticated: !!userState  && !!token,
    loading,
    error,
    notifications, 
    unreadCount,  
    acceptOrder, 
    rejectOrder, 
    getOrCreateConversation,
    cancelOrder,
    markNotificationsAsRead,
    setUser,
    login,
    register,
    updateProfile,
    logout,
    switchUserRole,
    sendSocketMessage,
    createListing,
    requestOtp,
    verifyOtp,
    resendOtp,
    forgotPasswordRequestOtp,
    resetPassword,
    changePassword,
    // refetchUser,
    setToken, // Expose setToken
    clearError,
    
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