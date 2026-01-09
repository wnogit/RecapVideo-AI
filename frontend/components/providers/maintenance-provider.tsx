'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { siteSettingsPublicApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Rocket, Mail, ArrowRight, Timer, Star, Wand2 } from 'lucide-react';
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

// Animated text that types out character by character
const AnimatedText = ({ 
  text, 
  className = "", 
  delay = 0,
  speed = 0.03,
  gradient = false,
  gradientColors = "from-white to-white"
}: { 
  text: string; 
  className?: string;
  delay?: number;
  speed?: number;
  gradient?: boolean;
  gradientColors?: string;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed * 1000);
      return () => clearTimeout(timer);
    }
  }, [displayedText, text, started, speed]);

  return (
    <span className={`${className} ${gradient ? `bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent` : ''}`}>
      {displayedText}
      {displayedText.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="inline-block w-[2px] h-[0.9em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
};

// Rotating words with fade effect
const RotatingWords = ({ words, className = "" }: { words: string[]; className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Aurora background effect
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#030014]" />
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent)',
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
      animate={{
        x: [0, -80, 0],
        y: [0, -60, 0],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }}
      animate={{
        scale: [1, 1.4, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// Floating stars
const FloatingStars = () => {
  const stars = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Animated border glow card
const GlowCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative group ${className}`}>
    <motion.div
      className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-30 blur-sm group-hover:opacity-50 transition-opacity"
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ backgroundSize: '200% 200%' }}
    />
    <div className="relative bg-[#0c0c1d]/90 backdrop-blur-xl rounded-2xl border border-white/10">
      {children}
    </div>
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden min-h-screen">
      {/* Aurora background */}
      <AuroraBackground />
      <FloatingStars />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-8">
        <GlowCard className="p-8 md:p-12">
          {/* Logo with glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-2xl opacity-60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-2xl shadow-purple-500/30">
                <Wand2 className="h-10 w-10 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Brand name - animated typing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <AnimatedText 
                text="RecapVideo" 
                delay={0.5}
                speed={0.08}
                gradient
                gradientColors="from-violet-400 via-fuchsia-400 to-pink-400"
                className="font-bold"
              />
              <AnimatedText 
                text=".AI" 
                delay={1.3}
                speed={0.1}
                className="text-white font-bold"
              />
            </h1>
          </motion.div>

          {/* Main tagline - all animated */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="text-center mb-8"
          >
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              <AnimatedText text="We're crafting the " delay={2} speed={0.04} />
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400">
                <AnimatedText text="ultimate AI video" delay={2.8} speed={0.05} gradient gradientColors="from-amber-400 via-orange-400 to-yellow-400" />
              </span>
              <AnimatedText text=" " delay={4} speed={0.01} />
              <RotatingWords 
                words={['experience', 'platform', 'revolution', 'magic']} 
                className="font-bold text-white min-w-[140px]"
              />
            </p>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Sparkles, text: 'AI Powered', gradient: 'from-violet-500 to-purple-600' },
              { icon: Rocket, text: 'Lightning Fast', gradient: 'from-pink-500 to-rose-600' },
              { icon: Star, text: 'Premium Quality', gradient: 'from-amber-500 to-orange-600' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 4.7 + i * 0.15, type: "spring", bounce: 0.4 }}
                whileHover={{ scale: 1.08, y: -3 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${item.gradient} shadow-lg`}
              >
                <item.icon className="h-4 w-4 text-white" />
                <span className="text-sm text-white font-semibold">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Status message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 5.2 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-gray-300 text-sm">{message}</span>
              </div>
            </motion.div>
          )}

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 5.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-5 text-gray-500">
              <Timer className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium">Launching Soon</span>
            </div>
            <div className="flex justify-center gap-3 md:gap-5">
              {[
                { value: countdown.hours, label: 'HRS' },
                { value: countdown.minutes, label: 'MIN' },
                { value: countdown.seconds, label: 'SEC' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl blur-lg" />
                  <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-xl px-5 py-4 min-w-[85px]">
                    <motion.div
                      key={item.value}
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-3xl md:text-4xl font-bold text-white tabular-nums text-center"
                    >
                      {item.value.toString().padStart(2, '0')}
                    </motion.div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 text-center font-medium">
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
            transition={{ delay: 5.8 }}
            className="max-w-sm mx-auto"
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
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl text-sm"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="h-11 px-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl border-0 shadow-lg shadow-violet-500/20"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 text-center"
                >
                  <p className="text-emerald-400 flex items-center justify-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4" />
                    <AnimatedText text="Thanks! We'll notify you when we launch!" delay={0} speed={0.03} />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6 }}
            className="mt-10 text-center"
          >
            <p className="text-gray-600 text-xs">
              © 2026 RecapVideo.AI — 
              <AnimatedText text=" Built with love" delay={6.2} speed={0.05} />
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="inline-block mx-1"
              >
                💜
              </motion.span>
            </p>
          </motion.div>
        </GlowCard>
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
