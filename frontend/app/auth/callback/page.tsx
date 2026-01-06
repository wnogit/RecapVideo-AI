'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

type CallbackStatus = 'processing' | 'success' | 'error';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { setAuth } = useAuthStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Device ID
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage('Google sign-in was cancelled');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received');
      return;
    }

    try {
      // Exchange code for tokens with our backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            device_id: state || 'unknown',
            redirect_uri: `${window.location.origin}/auth/callback`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Store auth tokens
      setAuth(
        data.access_token,
        data.refresh_token || '',
        data.user
      );

      setStatus('success');

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to complete sign-in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            RecapVideo AI
          </span>
        </div>

        {/* Processing State */}
        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Signing you in...
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we set up your account
            </p>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome! 🎉
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Redirecting you to your dashboard...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign-in Failed
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {errorMessage}
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
