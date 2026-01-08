/**
 * useAuth Hook - Authentication utilities (Email/Password + Google OAuth)
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
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

  // Email/password login
  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    router.push('/dashboard');
  };

  // Email/password signup
  const handleSignup = async (email: string, password: string, name: string) => {
    await signup(email, password, name);
    router.push('/dashboard');
  };

  // Google OAuth login
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
    login: handleLogin,
    signup: handleSignup,
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
