import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Zap,
  Globe,
  Mic,
  Clock,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Youtube,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Star className="mr-1 h-3 w-3" />
              AI-Powered Video Recaps
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Transform YouTube Videos into{' '}
              <span className="text-primary">Burmese Recaps</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Automatically extract, translate, and voice-over YouTube content 
              with natural-sounding Burmese AI voices. Create engaging recap videos in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              3 free credits on signup • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Create Amazing Recaps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform handles the entire process from transcript
              extraction to final video rendering.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Youtube className="h-10 w-10 text-red-500 mb-2" />
                <CardTitle>YouTube Integration</CardTitle>
                <CardDescription>
                  Simply paste any YouTube URL and we extract the transcript automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle>Multi-Language Support</CardTitle>
                <CardDescription>
                  Translate content to Burmese, Thai, Chinese, and more with AI accuracy.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Mic className="h-10 w-10 text-green-500 mb-2" />
                <CardTitle>Natural AI Voices</CardTitle>
                <CardDescription>
                  Microsoft Neural TTS voices for natural-sounding Burmese voiceovers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-500 mb-2" />
                <CardTitle>Fast Processing</CardTitle>
                <CardDescription>
                  Generate complete recap videos in just a few minutes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle>Smart Summarization</CardTitle>
                <CardDescription>
                  AI creates engaging scripts that capture key points perfectly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-orange-500 mb-2" />
                <CardTitle>Cloud Storage</CardTitle>
                <CardDescription>
                  Your videos are securely stored and accessible anytime, anywhere.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create professional recap videos in just 3 simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste YouTube URL</h3>
              <p className="text-muted-foreground">
                Simply paste any YouTube video URL into our dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Settings</h3>
              <p className="text-muted-foreground">
                Select language, voice type, and other preferences
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Download & Share</h3>
              <p className="text-muted-foreground">
                Get your recap video and share it anywhere
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for trying out</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$5</span>
                  <span className="text-muted-foreground"> / 10 credits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    10 video creations
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All voice options
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Cloud storage
                  </li>
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Popular</CardTitle>
                <CardDescription>Best value for creators</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground"> / 50 credits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    50 video creations
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All voice options
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority processing
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    20% savings
                  </li>
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For power users</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$35</span>
                  <span className="text-muted-foreground"> / 100 credits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    100 video creations
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All voice options
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    30% savings
                  </li>
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Create Your First Recap Video?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of content creators using RecapVideo.AI to create
              engaging Burmese content from YouTube videos.
            </p>
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
