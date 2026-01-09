'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { siteSettingsPublicApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Film, Clapperboard, Sparkles, Clock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

// Film strip component
const FilmStrip = ({ side }: { side: 'left' | 'right' }) => (
  <div className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} top-0 h-full w-12 bg-gray-900/80 hidden md:flex flex-col justify-around items-center py-4`}>
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="w-6 h-4 bg-gray-800 rounded-sm"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
      />
    ))}
  </div>
);

// Maintenance UI Component
function MaintenanceUI({ message }: { message?: string }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + 2);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center overflow-hidden">
      {/* Film strips on sides */}
      <FilmStrip side="left" />
      <FilmStrip side="right" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ 
              y: [0, -100],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 5,
              repeat: Infinity
            }}
          >
            <Sparkles className="h-4 w-4 text-yellow-400/50" />
          </motion.div>
        ))}

        {/* Film reel circles */}
        <motion.div 
          className="absolute -top-40 -left-40 w-80 h-80 border-4 border-purple-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-96 h-96 border-4 border-pink-500/20 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo / Brand */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/50">
            <Clapperboard className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            RecapVideo.AI
          </span>
        </motion.h1>

        {/* Subtitle with film theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-purple-200 text-sm">
            <Film className="h-4 w-4" />
            <span>Behind The Scenes</span>
            <Film className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Main message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4 mb-10"
        >
          <p className="text-xl md:text-2xl text-gray-200">
            We're developing the <span className="text-yellow-400 font-semibold">best AI RecapVideo</span> experience
          </p>
          <p className="text-lg text-gray-300">
            with <span className="text-pink-400">magical features</span> you've never seen before ✨
          </p>
          {message && (
            <p className="text-lg text-purple-300 mt-4 p-4 bg-white/5 rounded-lg">
              {message}
            </p>
          )}
          <p className="text-xl text-white font-medium mt-6">
            Are you ready for the <span className="text-purple-400">Surprise</span>? 🎬
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center gap-4 mb-10"
        >
          {[
            { value: countdown.hours, label: 'Hours' },
            { value: countdown.minutes, label: 'Minutes' },
            { value: countdown.seconds, label: 'Seconds' },
          ].map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[80px]">
              <div className="text-3xl font-bold text-white">
                {item.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Email notification form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="max-w-md mx-auto"
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400">🎉 Thanks! We'll notify you when we're back!</p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-10 text-gray-500 text-sm"
        >
          © 2026 RecapVideo.AI - Creating Magic with AI 🎥
        </motion.p>
      </div>
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
    // Skip check for bypass paths (admin pages)
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
      // If API fails, allow access (fail open)
      console.error('Failed to check maintenance status:', error);
      setState({
        isLoading: false,
        isMaintenanceMode: false,
        isAllowed: true,
      });
    }
  };

  // Show maintenance UI if maintenance mode is ON and user is NOT allowed
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
