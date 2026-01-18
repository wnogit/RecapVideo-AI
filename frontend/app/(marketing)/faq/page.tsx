'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  HelpCircle,
  CreditCard,
  Video,
  Globe,
  Clock,
  Shield,
  Zap,
  MessageCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { studioUrls } from '@/lib/config';

const faqCategories = [
  {
    category: 'Getting Started',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'from-yellow-600/20 to-orange-600/20',
    questions: [
      {
        q: 'What is RecapVideo.AI?',
        a: 'RecapVideo.AI is an AI-powered platform that transforms YouTube videos into engaging recap videos with Burmese translation and natural AI voiceovers. Simply paste a YouTube URL, and our AI handles transcript extraction, translation, script creation, and video rendering automatically.'
      },
      {
        q: 'How do I get started?',
        a: 'Getting started is easy! Just sign up for a free account, and you\'ll receive 4 free credits to try out our service. Paste any YouTube URL into the dashboard, customize your settings, and click generate. Your recap video will be ready in a few minutes.'
      },
      {
        q: 'Do I need any technical skills?',
        a: 'No technical skills required! Our platform is designed to be user-friendly. If you can copy and paste a YouTube URL, you can use RecapVideo.AI. Everything is automated - from transcript extraction to final video rendering.'
      }
    ]
  },
  {
    category: 'Credits & Pricing',
    icon: CreditCard,
    color: 'text-green-400',
    bgColor: 'from-green-600/20 to-emerald-600/20',
    questions: [
      {
        q: 'How does the credit system work?',
        a: 'Each video creation uses 2 credits, regardless of the video length or complexity. When you sign up, you get 4 free credits to try our service (enough for 2 videos). You can purchase more credits in packages: 10 credits for $5 (5 videos), 30 credits for $13, or 100 credits for $40.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We currently accept KBZ Pay, Wave Pay, and bank transfers for Myanmar users. International payment options are coming soon. All payments are processed securely through our trusted payment partners.'
      },
      {
        q: 'Do credits expire?',
        a: 'No, your purchased credits never expire as long as your account remains active. Promotional or bonus credits may have different terms and expiration dates, which will be clearly communicated when granted.'
      },
      {
        q: 'Can I get a refund?',
        a: 'Credits are non-refundable once purchased. However, if you experience technical issues that prevent a video from being created successfully, we\'ll refund those credits to your account. Contact our support team for assistance.'
      }
    ]
  },
  {
    category: 'Video Processing',
    icon: Video,
    color: 'text-red-400',
    bgColor: 'from-red-600/20 to-rose-600/20',
    questions: [
      {
        q: 'Which videos can I use?',
        a: 'You can process any public YouTube video that has captions or clear audio for speech recognition. Private videos, age-restricted content, or videos without accessible audio cannot be processed. Please ensure you have the right to use the content.'
      },
      {
        q: 'How long can the source video be?',
        a: 'We support videos up to 3 hours in length. The processing time scales with video length - longer videos take more time to process but still only use 2 credits.'
      },
      {
        q: 'How long does processing take?',
        a: 'Most videos are processed in 2-5 minutes, depending on the source video length and current server load. You\'ll receive a notification when your video is ready, and you can download it directly from your dashboard.'
      },
      {
        q: 'What quality are the output videos?',
        a: 'Output videos are rendered in 720p by default, with 1080p available for Popular and Pro tier credits. Videos are optimized for social media sharing while maintaining good quality.'
      }
    ]
  },
  {
    category: 'Languages & Voices',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'from-blue-600/20 to-cyan-600/20',
    questions: [
      {
        q: 'Which languages are supported?',
        a: 'Currently, we specialize in Burmese (Myanmar) translations and voiceovers. We also support Thai, Chinese, and English outputs. More languages are being added based on user demand.'
      },
      {
        q: 'How accurate are the translations?',
        a: 'We use advanced AI translation models (GPT-4) combined with specialized prompts for natural Burmese. While AI translation is highly accurate, it may occasionally have nuances that differ from human translation. We continuously improve our translation quality.'
      },
      {
        q: 'What voice options are available?',
        a: 'We use Microsoft Neural TTS voices which provide natural-sounding speech. For Burmese, we offer both male and female voice options. You can select your preferred voice in the settings before generating a video.'
      }
    ]
  },
  {
    category: 'Account & Security',
    icon: Shield,
    color: 'text-violet-400',
    bgColor: 'from-violet-600/20 to-purple-600/20',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes, we take security seriously. All data is encrypted in transit and at rest. Your videos are stored securely in the cloud, and we never share your personal information with third parties. See our Privacy Policy for full details.'
      },
      {
        q: 'How long are videos stored?',
        a: 'Generated videos are stored for 30 days after creation. You can download them anytime during this period. If you need longer storage, we recommend downloading and backing up your videos locally.'
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes, you can request account deletion at any time by contacting our support team. Upon deletion, all your data including generated videos will be permanently removed from our servers.'
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
            <HelpCircle className="mr-1 h-3 w-3" />
            Help Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about RecapVideo.AI. Can&apos;t find what you&apos;re looking for?
            <Link href="/contact" className="text-violet-400 hover:text-violet-300 ml-1">Contact us</Link>.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${category.bgColor} flex items-center justify-center`}>
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                </div>
                <h2 className="text-xl font-semibold">{category.category}</h2>
              </div>

              {/* Questions Accordion */}
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.category}-${index}`}
                    className="glass rounded-xl border-white/10 px-6 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-5 text-left">
                      <span className="font-medium">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <p className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="glass rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-pink-500/10" />
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our support team is here to help! Reach out to us and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
                <a href="https://t.me/recapvideo" target="_blank">
                  <Button variant="outline" className="glass border-white/20 hover:bg-white/10">
                    Telegram Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Ready to start creating amazing recap videos?
          </p>
          <a href={studioUrls.signup}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
