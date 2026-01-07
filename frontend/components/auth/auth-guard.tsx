'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!user && !isLoading) {
      fetchUser().catch(() => {
        router.push('/login');
      });
    }
  }, [user, isLoading, fetchUser, router]);

  useEffect(() => {
    if (!isLoading && user) {
      if (requireAdmin && !user.is_admin) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, requireAdmin, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAdmin && !user.is_admin) {
    return null;
  }

  return <>{children}</>;
}
