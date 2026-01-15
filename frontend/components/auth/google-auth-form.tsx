'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Sparkles, 
  Zap, 
  Video, 
  Globe, 
  AlertTriangle, 
  RefreshCw,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDeviceId } from '@/lib/fingerprint';
import { GoogleIcon } from '@/components/icons/google-icon';

type AuthStatus = 'loading' | 'checking' | 'allowed' | 'blocked' | 'error';

interface IPCheckResult {
  allowed: boolean;
  reason?: string;
  country?: string;
  city?: string;
}

export function GoogleAuthForm() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [ipInfo, setIpInfo] = useState<IPCheckResult | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Check IP on mount
  useEffect(() => {
    checkAccess();
    loadDeviceId();
  }, []);

  const loadDeviceId = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
  };

  const checkAccess = async () => {
    setStatus('checking');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/check-ip`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      setIpInfo(data);
      
      if (data.allowed) {
        setStatus('allowed');
      } else {
        setStatus('blocked');
      }
    } catch (error) {
      console.error('IP check failed:', error);
      // If check fails, allow access (fail open for better UX)
      setStatus('allowed');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!deviceId) {
      console.error('Device ID not loaded');
      return;
    }
    
    setIsSigningIn(true);
    
    // Generate CSRF token for OAuth state
    const csrfToken = crypto.randomUUID();
    const oauthState = JSON.stringify({ csrf: csrfToken, deviceId });
    
    // Store state in sessionStorage for verification in callback
    sessionStorage.setItem('oauth_state', oauthState);
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('state', btoa(oauthState)); // Base64 encode state
    
    window.location.href = googleAuthUrl.toString();
  };

  // Features list
  const features = [
    { icon: Zap, text: 'Instant video summaries' },
    { icon: Globe, text: '50+ languages supported' },
    { icon: Video, text: 'AI-powered transcription' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">RecapVideo AI</span>
          </div>
          <p className="text-white/80 text-lg">
            Transform any video into actionable insights
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Turn hours of video<br />
            into minutes of reading
          </h1>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white font-semibold">Free Trial Included</span>
          </div>
          <p className="text-white/70 text-sm">
            Get 4 free credits when you sign up. No credit card required.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {(status === 'loading' || status === 'checking') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Shield className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Securing your connection...
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  This only takes a moment
                </p>
                <div className="mt-6">
                  <Loader2 className="w-6 h-6 mx-auto text-purple-600 animate-spin" />
                </div>
              </motion.div>
            )}

            {/* Blocked State */}
            {status === 'blocked' && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  VPN / Proxy Detected
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  For security reasons, we don't allow signups from VPNs, proxies, or datacenter IPs. 
                  Please disable your VPN and try again.
                </p>
                
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Why?</strong> This helps us prevent spam and abuse, 
                    ensuring a better experience for all users.
                  </p>
                </div>

                <Button 
                  onClick={checkAccess}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            )}

            {/* Allowed State - Show Google Sign In */}
            {status === 'allowed' && (
              <motion.div
                key="allowed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    RecapVideo AI
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sign in to start transforming videos into insights
                  </p>
                </div>

                {/* Google Sign In Button */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn || !deviceId}
                  className="w-full h-14 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="ml-3 text-base font-medium">
                    {isSigningIn ? 'Signing in...' : 'Continue with Google'}
                  </span>
                </Button>

                {/* Security Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secured by Google OAuth</span>
                </div>

                {/* Mobile Trial Banner */}
                <div className="lg:hidden mt-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-violet-100 dark:border-violet-900">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      4 Free Credits
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Start creating video summaries instantly
                  </p>
                </div>

                {/* Terms */}
                <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-purple-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Please try again in a moment
                </p>
                <Button onClick={checkAccess} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
