'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Menu, X, Sparkles, LayoutDashboard, ArrowRight, User } from 'lucide-react';
import { studioUrls } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check auth state on mount
    const check = async () => {
      try {
        await checkAuth();
      } catch (e) {
        // User not authenticated, that's fine
      }
      setAuthChecked(true);
    };
    check();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Gradient Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-violet-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'glass border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Film className="h-7 w-7 text-violet-500 transition-transform group-hover:scale-110" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text">RecapVideo.AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-violet-400 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-violet-400 transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="text-sm font-medium text-muted-foreground hover:text-violet-400 transition-colors">
              FAQ
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {!authChecked ? (
                // Loading skeleton
                <Skeleton className="h-9 w-24 rounded-lg" />
              ) : isAuthenticated ? (
                // Logged in - Show avatar and dashboard button
                <div className="flex items-center gap-3">
                  <Link href="/profile">
                    <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-violet-600 text-white text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 relative overflow-hidden group">
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/20 to-violet-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </span>
                    </Button>
                  </Link>
                </div>
              ) : (
                // Not logged in - Show sign in and get started
                <>
                  <a
                    href={studioUrls.login}
                    className="text-sm font-medium text-muted-foreground hover:text-violet-400 transition-colors"
                  >
                    Sign In
                  </a>
                  <a href={studioUrls.signup}>
                    <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </a>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button 
              className="p-2 glass rounded-lg transition-colors hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden glass border-t border-white/10"
            >
              <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-4">
                <Link 
                  href="/#features" 
                  className="text-sm font-medium py-2 hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/#pricing" 
                  className="text-sm font-medium py-2 hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/faq" 
                  className="text-sm font-medium py-2 hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link 
                  href="/contact" 
                  className="text-sm font-medium py-2 hover:text-violet-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                  {!authChecked ? (
                    <Skeleton className="h-10 w-full rounded-lg" />
                  ) : isAuthenticated ? (
                    // Logged in - Show dashboard link
                    <>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar_url} />
                          <AvatarFallback className="bg-violet-600 text-white text-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user?.name}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </div>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Go to Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // Not logged in
                    <>
                      <a href={studioUrls.login}>
                        <Button variant="outline" className="w-full glass border-white/20 hover:bg-white/10">Sign In</Button>
                      </a>
                      <a href={studioUrls.signup}>
                        <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Get Started
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 md:py-12 glass">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid gap-10 grid-cols-2 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4 group">
                <Film className="h-6 w-6 text-violet-500" />
                <span className="font-bold gradient-text">RecapVideo.AI</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transform any video into engaging Burmese content with AI-powered translation and voiceover.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Made with</span>
                <Sparkles className="h-3 w-3 text-pink-400" />
                <span className="text-xs text-muted-foreground">by RecapVideo Team</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-violet-400 transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-violet-400 transition-colors">Pricing</Link></li>
                <li><Link href="/#demo" className="hover:text-violet-400 transition-colors">Demo</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-violet-400 transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/contact" className="hover:text-violet-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-violet-400 transition-colors">FAQ</Link></li>
                <li><a href="https://t.me/recapvideo" target="_blank" className="hover:text-violet-400 transition-colors">Telegram Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RecapVideo.AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>🇲🇲 Proudly serving Myanmar creators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
