import type  { User } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  email: string | null; 
  login: (user: User, token: string) => void;
  logout: () => void;
  setEmail: (email: string) => void; 
  clearEmail: () => void; 
}


const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      email: null, 
      login: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, email: null }),
      setEmail: (email) => set({ email }), 
      clearEmail: () => set({ email: null }), 
    }),
    {
      name: 'auth-store',
    }
  )
);


export default useAuthStore;
