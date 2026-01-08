/**
 * useAuth Hook - Authentication utilities (Google OAuth)
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    fetchUser,
    clearError,
  } = useAuthStore();
  
  const router = useRouter();

  // Fetch user on mount if authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !user) {
      fetchUser();
    }
  }, []);

  // Redirect to Google OAuth login
  const loginWithGoogle = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
    window.location.href = googleAuthUrl;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithGoogle,
    logout: handleLogout,
    clearError,
  };
}

/**
 * useRequireAuth - Redirect to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading, fetchUser, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push(redirectTo);
      return;
    }

    if (!user && !isLoading) {
      fetchUser().catch(() => {
        router.push(redirectTo);
      });
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo]);

  return { isAuthenticated, isLoading, user };
}

/**
 * useRequireAdmin - Redirect if not admin
 */
export function useRequireAdmin(redirectTo: string = '/dashboard') {
  const { user, isLoading } = useRequireAuth('/login');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.is_admin) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading, isAdmin: user?.is_admin ?? false };
}
