'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Mail,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('no-token');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await authApi.verifyEmail(token);
      setStatus('success');
      setMessage(response.data.message);
      setCredits(response.data.credits || 4);
    } catch (err: any) {
      setStatus('error');
      const detail = err.response?.data?.detail;
      setMessage(typeof detail === 'string' ? detail : 'Verification failed. The link may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Magic Glows */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-green-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Back to Website Button */}
      <Link 
        href="/" 
        className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center text-sm text-gray-400 hover:text-white transition-colors z-20"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to website
      </Link>

      {/* Logo - Top Center */}
      <Link href="/" className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white hidden sm:block">RecapVideo AI</span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center relative z-10"
      >
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Verifying your email...
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-400 mb-4">
                {message}
              </p>
              {credits > 0 && (
                <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-300 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">You received {credits} trial credits!</span>
                </div>
              )}
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/25 h-11"
              >
                Continue to Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-8 h-8 text-red-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Back to Sign In
                </Button>
              </div>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-400 mb-6">
                We've sent you a verification link. Please check your inbox and click the link to verify your email address.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 24 hours.
              </p>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Back to Sign In
              </Button>
            </>
          )}
        </motion.div>
      </div>
    );
  }
