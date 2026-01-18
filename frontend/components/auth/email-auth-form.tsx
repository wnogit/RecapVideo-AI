'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  ChevronLeft,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { getDeviceId } from '@/lib/fingerprint';
import { siteConfig } from '@/lib/config';
import { GoogleIcon } from '@/components/icons/google-icon';

type AuthMode = 'login' | 'signup';

interface EmailAuthFormProps {
  initialMode?: AuthMode;
}

// Allowed email domains
const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com', 'live.com'];

export function EmailAuthForm({ initialMode = 'login' }: EmailAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const { isAuthenticated, checkAuth } = useAuthStore();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        await checkAuth();
        // If we get here without error, user is authenticated
        if (useAuthStore.getState().isAuthenticated) {
          router.push('/dashboard');
        }
      } catch (e) {
        // Not authenticated, stay on login page
      }
    };
    checkAndRedirect();
  }, [router, checkAuth]);

  useEffect(() => {
    loadDeviceId();
  }, []);

  const loadDeviceId = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
  };

  // Load referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }

    const domain = email.toLowerCase().split('@')[1];
    if (!domain) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    if (!ALLOWED_DOMAINS.includes(domain)) {
      setEmailError(`Only Gmail, Yahoo, Outlook, Hotmail, and Live emails are allowed`);
      return false;
    }

    setEmailError(null);
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }

    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const response = await authApi.signup({
          email,
          password,
          name,
          device_id: deviceId || undefined,
          referral_code: referralCode || undefined,
        });

        setSuccess(response.data.message);
        setMode('login');
      } else {
        const response = await authApi.login({
          email,
          password,
          device_id: deviceId || undefined,
          remember_me: rememberMe,
        });

        const { access_token, refresh_token, user } = response.data;

        setAuth(access_token, refresh_token, user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      if (typeof detail === 'object') {
        if (detail.code === 'VPN_DETECTED') {
          setError(detail.message || 'Please disconnect VPN/Proxy to continue.');
        } else if (detail.code === 'EMAIL_NOT_VERIFIED') {
          setError(detail.message || 'Please verify your email before logging in.');
        } else {
          setError(detail.message || 'An error occurred');
        }
      } else {
        setError(detail || 'An error occurred. Please try again.');
      }
      // Trigger shake animation on error
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Generate CSRF token for OAuth state
    const csrfToken = crypto.randomUUID();
    const oauthState = JSON.stringify({ csrf: csrfToken, deviceId: deviceId || 'unknown' });

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Magic Glows */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Back to Website Button */}
      <a
        href={siteConfig.landingUrl}
        className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center text-sm text-gray-400 hover:text-white transition-colors z-20"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to website
      </a>

      {/* Logo - Top Center */}
      <a href={siteConfig.landingUrl} className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white hidden sm:block">RecapVideo AI</span>
      </a>

      {/* Animated Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shake ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          x: { duration: 0.4 }
        }}
        className="w-full max-w-md mx-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative z-10 mt-16 sm:mt-20"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {mode === 'login'
              ? 'Sign in to continue creating amazing videos'
              : 'Start creating AI-powered recap videos'}
          </p>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          )}

          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Label htmlFor="referralCode" className="text-gray-300">
                Referral Code <span className="text-gray-500">(optional)</span>
              </Label>
              <div className="relative mt-1.5">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all uppercase tracking-widest"
                  maxLength={10}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                သူငယ်ချင်းတစ်ယောက်ဆီက referral code ရှိရင် ထည့်ပါ
              </p>
            </motion.div>
          )}

          <div>
            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all ${emailError ? 'border-red-500/50' : ''}`}
                disabled={isLoading}
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-400 mt-1.5">{emailError}</p>
            )}
            {mode === 'signup' && !emailError && (
              <p className="text-xs text-gray-500 mt-1.5">
                Allowed: Gmail, Yahoo, Outlook, Hotmail, Live
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                className={`pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all ${passwordError ? 'border-red-500/50' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-400 mt-1.5">{passwordError}</p>
            )}
          </div>

          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setRememberMe(checked === true)}
                  className="border-white/20 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                />
                <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
                  Remember me
                </label>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 h-11 relative overflow-hidden group"
            disabled={isLoading}
          >
            {/* Glow effect on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/25 to-violet-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative flex items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </span>
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-transparent text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all h-11"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <GoogleIcon />
          <span className="ml-2">Continue with Google</span>
        </Button>

        {/* Toggle Mode */}
        <p className="text-center text-sm text-gray-400 mt-6">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
