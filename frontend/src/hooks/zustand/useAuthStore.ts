import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Socket, io } from 'socket.io-client';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { IUser, INotification } from '@passitpal/types';

interface AuthState {
  // State
  user: IUser | null;
  token: string | null;
  socket: Socket | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  notifications: INotification[];
  unreadCount: number;

  // Actions
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  login: (credentials: object) => Promise<void>;
  register: (userData: object) => Promise<string>;
  logout: () => void;
  updateProfile: (profileData: object) => Promise<string>;
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<string>;
  resetPassword: (passwordData: { email: string; resetToken: string; newPassword: string }) => Promise<string>;
  forgotPasswordRequestOtp: (email: string) => Promise<string>;
  requestOtp: (email: string, type: 'email' | 'mobile') => Promise<string>;
  verifyOtp: (email: string, otp: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset') => Promise<any>;
  resendOtp: (email: string, type: 'email' | 'mobile') => Promise<string>;
  submitReview: (orderId: string, rating: number, comment?: string) => Promise<string>;
  submitReport: (contentId: string, contentType: 'Listing' | 'User', reason: string, details?: string) => Promise<string>;
  saveListing: (listingId: string) => Promise<void>;
  unsaveListing: (listingId: string) => Promise<void>;
  createListing: (listingData: object) => Promise<string>;
  createPromotionOrder: (listingId: string, amount: number) => Promise<any>;
  acceptOrder: (orderId: string) => Promise<string>;
  rejectOrder: (orderId: string) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<string>;
  switchUserRole: (newRole: 'buyer' | 'seller') => Promise<string>;
  getOrCreateConversation: (recipientId: string) => Promise<string>;
  markNotificationsAsRead: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  // FIX: Use a specific type for the payload to match the implementation.
  sendSocketMessage: (payload: { conversationId: string; text: string; recipientId: string; imageBase64?: string; }) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      user: null, token: null, socket: null, isAuthenticated: false, loading: false, error: null, notifications: [], unreadCount: 0,

      // --- ACTION IMPLEMENTATIONS ---
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
          set({ isAuthenticated: true, token });
          get().connectSocket();
        } else {
          localStorage.removeItem('token');
          get().disconnectSocket();
          set({ isAuthenticated: false, token: null, user: null, notifications: [], unreadCount: 0 });
        }
      },
      clearError: () => set({ error: null }),

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          set({ user: response.data.user, error: null });
          get().setToken(response.data.token);
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed.';
          set({ error: message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          return response.data.message;
        } catch(err: any) {
          const message = err.response?.data?.message || "Registration failed.";
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        toast.success('Logged out successfully.');
        const token = get().token;
        get().setToken(null);
        try {
          if (token) await api.post('/auth/logout');
        } catch (error) { console.error("Logout API call failed", error); }
      },

      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.put('/users/profile', profileData);
            set({ user: data.user });
            toast.success(data.message || 'Profile updated!');
            return data.message;
        } catch(error: any) {
            const message = error.response?.data?.message || 'Update failed.';
            set({ error: message });
            toast.error(message);
            throw error;
        } finally {
            set({ loading: false });
        }
      },
      
      changePassword: async (passwordData) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.put('/auth/change-password', passwordData);
            toast.success(data.message);
            return data.message;
        } catch(err: any) {
            const message = err.response?.data?.message || "Failed to change password.";
            set({ error: message });
            toast.error(message);
            throw err;
        } finally {
            set({ loading: false });
        }
      },

      resetPassword: async (passwordData) => {
        set({ loading: true, error: null });
        try {
          const res = await api.put('/auth/reset-password', passwordData);
          return res.data.message;
        } catch (error: any) {
          const message = error.response?.data?.message || "Failed to reset password.";
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      forgotPasswordRequestOtp: async (email) => {
         const { data } = await api.post('/auth/forgot-password-request-otp', { email });
         return data.message;
      },

      requestOtp: async (email, type) => {
         const { data } = await api.post('/auth/request-otp', { email, type });
         return data.message;
      },
      
      verifyOtp: async (email, otp, type, purpose) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/verify-otp', { email, otp, type, purpose });
          if (data.resetToken) {
            toast.success('OTP verified! You can now set a new password.');
            return { resetToken: data.resetToken };
          }
          const { data: userData } = await api.get('/users/me');
          set({ user: userData.user });
          toast.success(data.message || 'Verification successful!');
          return { success: true };
        } catch (error: any) {
          const message = error.response?.data?.message || "OTP verification failed.";
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      resendOtp: async (email, type) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/resend-otp', { email, type });
            toast.success(res.data.message || 'A new OTP has been sent.');
            return res.data.message;
        } catch(error: any) {
            const message = error.response?.data?.message || "Failed to resend OTP.";
            set({ error: message });
            toast.error(message);
            throw error;
        } finally {
            set({ loading: false });
        }
      },

      submitReview: async (orderId, rating, comment) => {
        const { data } = await api.post(`/reviews/${orderId}`, { rating, comment });
        return data.message;
      },

      submitReport: async (contentId, contentType, reason, details) => {
         const { data } = await api.post(`/reports/${contentType}/${contentId}`, { reason, details });
         return data.message;
      },

      saveListing: async (listingId) => {
        const originalUser = get().user;
        if (!originalUser) return;
        const updatedListings = [...(originalUser.savedListings || []), listingId];
        set({ user: { ...originalUser, savedListings: updatedListings } });
        try {
            await api.post(`/users/me/saved/${listingId}`);
        } catch (error) {
            toast.error('Failed to save listing.');
            set({ user: originalUser }); 
        }
      },

      unsaveListing: async (listingId) => {
        const originalUser = get().user;
        if (!originalUser) return;
        const updatedListings = (originalUser.savedListings || []).filter(id => id !== listingId);
        set({ user: { ...originalUser, savedListings: updatedListings } });
        try {
            await api.delete(`/users/me/saved/${listingId}`);
        } catch (error) {
            toast.error('Failed to unsave listing.');
            set({ user: originalUser });
        }
      },

      createListing: async (listingData) => {
        const { data } = await api.post('/listings', listingData);
        return data.message;
      },

      createPromotionOrder: async (listingId, amount) => {
        const { data } = await api.post('/payments/create-order', { listingId, amount });
        return data;
      },

      acceptOrder: async (orderId) => {
        const { data } = await api.put(`/orders/${orderId}/status`, { status: 'accepted' });
        return data.message;
      },

      rejectOrder: async (orderId) => {
        const { data } = await api.put(`/orders/${orderId}/status`, { status: 'rejected' });
        return data.message;
      },

      cancelOrder: async (orderId) => {
        const { data } = await api.put(`/orders/${orderId}/cancel`);
        return data.message;
      },

      switchUserRole: async (newRole) => {
        const { data } = await api.post('/users/me/request-role-change', { newRole });
        set({ user: data.user });
        return data.message;
      },

      getOrCreateConversation: async (recipientId) => {
        const { data } = await api.post('/messages/conversations', { recipientId });
        return data.conversation._id;
      },

      markNotificationsAsRead: async () => {
        const currentUnreadCount = get().unreadCount;
        if (currentUnreadCount === 0) return;
        set({ unreadCount: 0 });
        try {
          await api.put('/notifications/mark-all-read');
        } catch (error) {
          console.error("Failed to mark notifications as read on backend", error);
          set({ unreadCount: currentUnreadCount });
        }
      },

      // --- SOCKET ACTIONS ---
      connectSocket: () => {
        const token = get().token;
        if (token && !get().socket?.connected) {
          const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';
          const socketURL = VITE_BACKEND_URL.replace('/api', '');
          const newSocket = io(socketURL, { auth: { token } });
          
          newSocket.on('newNotification', (notification: INotification) => {
              toast.success(notification.message, { icon: '🔔' });
              set(state => ({ 
                  notifications: [notification, ...state.notifications],
                  unreadCount: state.unreadCount + 1 
              }));
          });
          set({ socket: newSocket });
        }
      },
      disconnectSocket: () => {
        get().socket?.disconnect();
        set({ socket: null });
      },
      sendSocketMessage: (payload: { conversationId: string, text: string, recipientId: string, imageBase64?: string }) => {
        get().socket?.emit('sendMessage', payload);
      },
    }),
    {
      name: 'passitpal-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          state.connectSocket();
        }
      },
    }
  )
);

export default useAuthStore;
