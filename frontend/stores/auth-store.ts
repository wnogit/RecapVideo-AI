/**
 * Auth Store - Zustand store for authentication state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  credit_balance: number;
  created_at: string;
  last_login_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  setAuth: (access_token: string, refresh_token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const { access_token, refresh_token, user } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.signup({ email, password, username: name });
          const { access_token, refresh_token, user } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Signup failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setAuth: (access_token: string, refresh_token: string, user: User) => {
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      fetchUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
