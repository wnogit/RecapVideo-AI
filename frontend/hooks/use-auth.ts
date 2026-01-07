/**
 * useAuth Hook - Authentication utilities
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

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

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    router.push('/dashboard');
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    await signup(email, password, name);
    router.push('/dashboard');
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
