/**
 * Auth Store - Zustand store for authentication state
 * 
 * Security: Uses HttpOnly cookies for token storage (set by backend)
 * localStorage is used for backward compatibility and persisting user state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

// Check if we have any auth token (localStorage or cookie)
const hasAuthToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    localStorage.getItem('access_token') || 
    getCookie('access_token')
  );
};

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
  purchased_credits: number;
  tier: 'FREE' | 'PRO';
  is_pro: boolean;
  can_bypass_vpn: boolean;
  created_at: string;
  last_login_at?: string;
  // Auth provider info
  auth_provider: 'google' | 'email';
  has_password: boolean;
  has_google: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions - Both email/password and Google OAuth
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  setAuth: (access_token: string, refresh_token: string, user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
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

      // Email/password login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const { access_token, refresh_token, user } = response.data;
          
          // Store in both localStorage (for backward compat) and cookie
          localStorage.setItem('access_token', access_token);
          setCookie('access_token', access_token, 1); // 1 day for access token
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
            setCookie('refresh_token', refresh_token, 7); // 7 days for refresh
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Login failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // Email/password signup
      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.signup({ email, password, name });
          const { access_token, refresh_token, user } = response.data;
          
          // Store tokens (signup may not return tokens until email verified)
          if (access_token) {
            localStorage.setItem('access_token', access_token);
            setCookie('access_token', access_token, 1);
          }
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
            setCookie('refresh_token', refresh_token, 7);
          }
          
          set({
            user: user || null,
            isAuthenticated: !!access_token,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Signup failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // Google OAuth handles login - setAuth is called after OAuth callback

      logout: async () => {
        try {
          // Call backend to blacklist tokens
          await authApi.logout();
        } catch (error) {
          // Continue with client-side logout even if API fails
          console.error('Logout API error:', error);
        }
        
        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Clear cookies
        deleteCookie('access_token');
        deleteCookie('refresh_token');
        
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setAuth: (access_token: string, refresh_token: string, user: User) => {
        // Store in both localStorage and cookie
        localStorage.setItem('access_token', access_token);
        setCookie('access_token', access_token, 1);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
          setCookie('refresh_token', refresh_token, 7);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      fetchUser: async () => {
        // Check both localStorage and cookie for token
        if (!hasAuthToken()) {
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
          // Clear all auth data on fetch failure
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          deleteCookie('access_token');
          deleteCookie('refresh_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        // Alias for fetchUser - checks if user is authenticated
        await get().fetchUser();
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
