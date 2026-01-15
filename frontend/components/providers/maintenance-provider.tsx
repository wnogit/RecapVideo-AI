'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { siteSettingsPublicApi } from '@/lib/api';
import { motion } from 'framer-motion';

interface MaintenanceContextType {
  isLoading: boolean;
  isMaintenanceMode: boolean;
  isAllowed: boolean;
  message?: string;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isLoading: true,
  isMaintenanceMode: false,
  isAllowed: true,
});

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}

// Paths that should bypass maintenance check - ONLY admin pages
const BYPASS_PATHS = ['/admin'];

// Clean, modern maintenance UI - Linear/Vercel inspired
function MaintenanceUI({ message }: { message?: string }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetTime = new Date();
    targetTime.setDate(targetTime.getDate() + 7);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-auto">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute top-0 -left-40 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px]"
            style={{ animation: 'blob 12s infinite ease-in-out' }}
          />
          <div 
            className="absolute top-0 -right-40 w-[600px] h-[600px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px]"
            style={{ animation: 'blob 12s infinite ease-in-out 2s' }}
          />
          <div 
            className="absolute -bottom-40 left-1/2 w-[600px] h-[600px] bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px]"
            style={{ animation: 'blob 12s infinite ease-in-out 4s' }}
          />
        </div>
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              RecapVideo<span className="text-violet-400">.AI</span>
            </span>
          </motion.div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl mx-auto text-center">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-gray-300">Under Development</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              Something{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                amazing
              </span>
              <br />
              is coming
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto mb-12"
            >
              {message || "We're building the future of AI-powered video creation. Be the first to experience it."}
            </motion.p>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-4 gap-3 md:gap-4 max-w-md mx-auto mb-12"
            >
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Sec' },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 md:p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="text-2xl md:text-4xl font-bold text-white tabular-nums">
                      {item.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Email signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-md mx-auto"
            >
              {!isSubmitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all duration-200"
                      required
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Notify Me
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">You&apos;re on the list! We&apos;ll notify you.</span>
                </motion.div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Join 2,000+ creators waiting for launch. No spam, ever.
              </p>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500"
          >
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
            <div>© 2026 RecapVideo.AI. All rights reserved.</div>
          </motion.div>
        </footer>
      </div>

      {/* Global keyframes */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MaintenanceContextType>({
    isLoading: true,
    isMaintenanceMode: false,
    isAllowed: true,
  });
  const pathname = usePathname();

  useEffect(() => {
    checkMaintenanceStatus();
  }, [pathname]);

  const checkMaintenanceStatus = async () => {
    if (BYPASS_PATHS.some(path => pathname?.startsWith(path))) {
      setState({
        isLoading: false,
        isMaintenanceMode: false,
        isAllowed: true,
      });
      return;
    }

    try {
      const res = await siteSettingsPublicApi.getMaintenanceStatus();
      const data = res.data;

      setState({
        isLoading: false,
        isMaintenanceMode: data.maintenance_mode,
        isAllowed: data.is_allowed,
        message: data.message,
      });
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      setState({
        isLoading: false,
        isMaintenanceMode: false,
        isAllowed: true,
      });
    }
  };

  const showMaintenance = !state.isLoading && state.isMaintenanceMode && !state.isAllowed;

  return (
    <MaintenanceContext.Provider value={state}>
      {showMaintenance ? (
        <MaintenanceUI message={state.message} />
      ) : (
        children
      )}
    </MaintenanceContext.Provider>
  );
}
