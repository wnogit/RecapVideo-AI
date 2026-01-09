'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { siteSettingsPublicApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Rocket, Mail, ArrowRight, Timer } from 'lucide-react';
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

// Animated gradient text with wave effect
const WaveText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={`inline-flex ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.05,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// Typing effect component
const TypeWriter = ({ words, className = "" }: { words: string[]; className?: string }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex, words]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-current ml-1 align-middle"
      />
    </span>
  );
};

// Floating particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: `hsl(${260 + Math.random() * 60}, 100%, ${60 + Math.random() * 20}%)`,
        }}
        animate={{
          y: [0, -1000],
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
        }}
        transition={{
          duration: 8 + Math.random() * 10,
          delay: Math.random() * 5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

// Glowing orbs background
const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        left: '-10%',
        top: '-20%',
      }}
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
        right: '-10%',
        bottom: '-10%',
      }}
      animate={{
        x: [0, -80, 0],
        y: [0, -60, 0],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        left: '40%',
        top: '30%',
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
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
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden min-h-screen">
      {/* Animated background */}
      <GlowingOrbs />
      <FloatingParticles />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 1, bounce: 0.4 }}
          className="mb-10"
        >
          <div className="relative inline-flex">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 blur-2xl opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 shadow-2xl">
              <Zap className="h-10 w-10 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Brand name with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RecapVideo
            </span>
            <span className="text-white">.AI</span>
          </h1>
        </motion.div>

        {/* Animated tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            We're building the{' '}
            <span className="font-semibold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              <WaveText text="best AI RecapVideo" />
            </span>
            {' '}
            <TypeWriter 
              words={['Web', 'Tool', 'Platform', 'Experience']} 
              className="text-white font-bold"
            />
          </p>
        </motion.div>

        {/* Features pills with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {[
            { icon: Sparkles, text: 'AI Powered', color: 'from-violet-500 to-purple-500' },
            { icon: Rocket, text: 'Lightning Fast', color: 'from-pink-500 to-rose-500' },
            { icon: Zap, text: 'Magical Features', color: 'from-amber-500 to-orange-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${item.color} bg-opacity-10 border border-white/10 backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <item.icon className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Status message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-gray-300">{message}</span>
            </div>
          </motion.div>
        )}

        {/* Countdown timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 text-gray-500">
            <Timer className="h-4 w-4" />
            <span className="text-sm uppercase tracking-widest">Launching Soon</span>
          </div>
          <div className="flex justify-center gap-4">
            {[
              { value: countdown.hours, label: 'Hours' },
              { value: countdown.minutes, label: 'Minutes' },
              { value: countdown.seconds, label: 'Seconds' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-opacity" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 min-w-[100px]">
                  <motion.div
                    key={item.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl md:text-5xl font-bold text-white tabular-nums"
                  >
                    {item.value.toString().padStart(2, '0')}
                  </motion.div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-2">
                    {item.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Email form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="max-w-md mx-auto"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex gap-2"
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="Enter your email for updates"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-xl border-0 shadow-lg shadow-violet-500/25"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
              >
                <p className="text-green-400 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Thanks! We'll notify you when we launch!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-16 text-gray-600 text-sm"
        >
          © 2026 RecapVideo.AI — Crafted with 
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block mx-1"
          >
            💜
          </motion.span> 
          by AI
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
