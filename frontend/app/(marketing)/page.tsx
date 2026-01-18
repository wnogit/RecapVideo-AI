'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { studioUrls } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import {
  Play,
  Zap,
  Globe,
  Mic,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Youtube,
  Sparkles,
  Video,
  Download,
  Wand2,
  Brain,
  Layers,
  Timer,
  Users,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { creditPackagesApi, type CreditPackage } from '@/lib/api';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await creditPackagesApi.getPublic();
        setPackages(res.data || []);
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden flex justify-center">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium">AI-Powered Video Recaps</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-xs font-medium text-white">
                New
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Transform Videos into{' '}
              <span className="gradient-text">Burmese Magic</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Automatically extract, translate, and create stunning recap videos
              with natural Burmese AI voices. From YouTube to viral content in minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              {!hydrated ? (
                // Show nothing during SSR/hydration to avoid mismatch
                <Skeleton className="h-12 w-48 rounded-lg" />
              ) : isAuthenticated ? (
                // Logged in - Show Dashboard button with glow
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 h-12 px-8 text-base animate-pulse-glow relative overflow-hidden group"
                  >
                    {/* Glow sweep effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/25 to-violet-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center">
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  </Button>
                </Link>
              ) : (
                // Not logged in - Show Get Started & Demo
                <>
                  <a href={studioUrls.signup}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 h-12 px-8 text-base"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                  <Link href="#demo">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto glass border-white/20 hover:bg-white/10 h-12 px-8 text-base"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Watch Demo
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                4 free credits
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Ready in minutes
              </span>
            </motion.div>
          </motion.div>

          {/* Floating Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="relative max-w-4xl mx-auto">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 blur-3xl transform scale-110" />

              {/* Browser Mockup */}
              <div className="relative glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="max-w-sm mx-auto px-3 py-1 rounded-md bg-white/5 text-xs text-muted-foreground text-center">
                      studio.recapvideo.ai
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Video className="h-16 w-16 text-violet-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Dashboard Preview</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Sign up to access the full dashboard and start creating amazing recap videos
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Stats Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 md:-left-12 top-1/4 glass rounded-xl p-4 shadow-xl hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">3min</p>
                    <p className="text-xs text-muted-foreground">Avg. generation</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-4 md:-right-12 top-1/3 glass rounded-xl p-4 shadow-xl hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">1000+</p>
                    <p className="text-xs text-muted-foreground">Happy creators</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-12 md:py-16 flex justify-center">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
              <Wand2 className="mr-1 h-3 w-3" />
              Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="gradient-text">Magic</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our AI handles the entire workflow from video extraction to final render.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {/* Large Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, rotate: [0, -0.5, 0.5, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 lg:col-span-2 glass rounded-2xl p-8 group hover:bg-white/10 transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-transparent blur-2xl" />
              <Youtube className="h-12 w-12 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">YouTube Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Simply paste any YouTube URL and our AI automatically extracts transcripts,
                even from videos without captions using speech recognition.
              </p>
            </motion.div>

            {/* Small Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6 group hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <Globe className="h-10 w-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-2">Multi-Language</h3>
              <p className="text-sm text-muted-foreground">
                Burmese, Thai, Chinese, and more with AI accuracy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 group hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <Mic className="h-10 w-10 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-2">Natural Voices</h3>
              <p className="text-sm text-muted-foreground">
                Microsoft Neural TTS for natural Burmese voiceovers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6 group hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <Zap className="h-10 w-10 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
              <p className="text-sm text-muted-foreground">
                Complete videos in just a few minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-6 group hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <Brain className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-2">Smart Summaries</h3>
              <p className="text-sm text-muted-foreground">
                AI creates engaging scripts that capture key points.
              </p>
            </motion.div>

            {/* Large Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, rotate: [0, -0.5, 0.5, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="md:col-span-2 glass rounded-2xl p-8 group hover:bg-white/10 transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent blur-2xl" />
              <Shield className="h-12 w-12 text-violet-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">Cloud Storage & Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your videos are securely stored in the cloud with R2 storage.
                Access your content anytime, anywhere, from any device.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Magic Timeline */}
      <section id="how-it-works" className="py-12 md:py-16 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
        <div className="container px-4 md:px-6 max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-pink-500/10 text-pink-400 border-pink-500/20">
              <Timer className="mr-1 h-3 w-3" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Magic in <span className="gradient-text">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Create professional recap videos in minutes, not hours.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-purple-500/50 to-pink-500/50 hidden md:block" />

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative flex flex-col md:flex-row items-center gap-8 mb-16"
            >
              <div className="md:w-1/2 md:text-right">
                <div className="glass rounded-2xl p-8 inline-block">
                  <Youtube className="h-16 w-16 text-red-500 mb-4 mx-auto md:ml-auto md:mr-0" />
                  <h3 className="text-2xl font-bold mb-2">Paste YouTube URL</h3>
                  <p className="text-muted-foreground">
                    Simply paste any YouTube video URL into our dashboard. We support videos up to 3 hours long.
                  </p>
                </div>
              </div>
              <div className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-violet-500/30">
                1
              </div>
              <div className="md:w-1/2 hidden md:block" />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative flex flex-col md:flex-row items-center gap-8 mb-16"
            >
              <div className="md:w-1/2 hidden md:block" />
              <div className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-violet-500/30">
                2
              </div>
              <div className="md:w-1/2">
                <div className="glass rounded-2xl p-8 inline-block">
                  <Layers className="h-16 w-16 text-violet-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Customize Settings</h3>
                  <p className="text-muted-foreground">
                    Choose your target language, voice style, and other preferences. Our AI handles the rest.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative flex flex-col md:flex-row items-center gap-8"
            >
              <div className="md:w-1/2 md:text-right">
                <div className="glass rounded-2xl p-8 inline-block">
                  <Download className="h-16 w-16 text-green-500 mb-4 mx-auto md:ml-auto md:mr-0" />
                  <h3 className="text-2xl font-bold mb-2">Download & Share</h3>
                  <p className="text-muted-foreground">
                    Get your professionally rendered recap video and share it anywhere. Ready for social media!
                  </p>
                </div>
              </div>
              <div className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-violet-500/30">
                3
              </div>
              <div className="md:w-1/2 hidden md:block" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 flex justify-center">
        <div className="container px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
              <Star className="mr-1 h-3 w-3" />
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </motion.div>

          {/* Loading State */}
          {packagesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!packagesLoading && packages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Pricing packages coming soon!</p>
            </div>
          )}

          {/* Dynamic Packages - Compact cards matching buy page */}
          {!packagesLoading && packages.length > 0 && (
            <div className={`grid gap-4 max-w-4xl mx-auto ${packages.length === 1 ? 'sm:grid-cols-1 max-w-sm' :
              packages.length === 2 ? 'sm:grid-cols-2 max-w-2xl' :
                packages.length === 3 ? 'sm:grid-cols-3' :
                  'sm:grid-cols-2 lg:grid-cols-4'
              }`}>
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card className={`h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${pkg.is_popular
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'glass border-white/10 hover:border-primary/50'
                    }`}>
                    {pkg.is_popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className={`text-center pb-2 ${pkg.is_popular ? 'pt-5' : 'pt-4'}`}>
                      <CardTitle className="text-base">{pkg.name}</CardTitle>
                      <CardDescription className="text-xs">{pkg.credits} credits</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-3">
                      <div className="mb-2">
                        {pkg.discount_percent > 0 ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through mr-2">
                              {pkg.price_mmk
                                ? `${Math.round(pkg.price_mmk / (1 - pkg.discount_percent / 100)).toLocaleString()}`
                                : `$${(pkg.price_usd / (1 - pkg.discount_percent / 100)).toFixed(2)}`}
                            </span>
                            <span className={`text-2xl font-bold text-green-400 ${pkg.is_popular ? 'gradient-text' : ''}`}>
                              {pkg.price_mmk ? `${pkg.price_mmk.toLocaleString()}` : `$${pkg.price_usd}`}
                            </span>
                          </>
                        ) : (
                          <span className={`text-2xl font-bold ${pkg.is_popular ? 'gradient-text' : ''}`}>
                            {pkg.price_mmk ? `${pkg.price_mmk.toLocaleString()}` : `$${pkg.price_usd}`}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs ml-1">
                          {pkg.price_mmk ? 'MMK' : 'USD'}
                        </span>
                      </div>
                      {pkg.discount_percent > 0 && (
                        <Badge variant="secondary" className="mb-3 text-xs text-green-400 bg-green-500/10">
                          Save {pkg.discount_percent}%
                        </Badge>
                      )}
                      <ul className="text-xs space-y-1.5 text-left mt-3">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {Math.floor(pkg.credits / 2)} video creations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          AI-powered scripts
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          Never expires
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4">
                      <a href={studioUrls.signup} className="block w-full">
                        <Button
                          className="w-full"
                          size="sm"
                          variant={pkg.is_popular ? 'default' : 'outline'}
                        >
                          {pkg.is_popular && <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                          Get Started
                        </Button>
                      </a>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-3xl" />
        </div>
        <div className="container px-4 md:px-6 max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Create <span className="gradient-text">Magic</span>?
            </h2>
            <p className="text-muted-foreground mb-10 text-lg max-w-xl mx-auto">
              Join thousands of content creators using RecapVideo.AI to transform
              YouTube videos into engaging Burmese content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={studioUrls.signup}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 h-14 px-10 text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              🎉 Get 4 free credits when you sign up today
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
