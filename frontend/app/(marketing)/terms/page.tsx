'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CreditCard, Video, AlertTriangle, Scale, Ban, RefreshCw, MessageSquare, Gavel } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const termsSections = [
  {
    id: 'acceptance',
    icon: FileText,
    title: 'Acceptance of Terms',
    content: `By accessing or using RecapVideo.AI, you agree to be bound by these Terms of Service and all applicable laws and regulations.

• You must be at least 18 years old or have parental consent to use our services.
• If you are using our services on behalf of an organization, you represent that you have the authority to bind that organization to these terms.
• If you do not agree to these terms, you may not access or use our services.

These terms may be updated from time to time, and your continued use of the service constitutes acceptance of any changes.`
  },
  {
    id: 'services',
    icon: Video,
    title: 'Description of Services',
    content: `RecapVideo.AI provides AI-powered video recap generation services:

• **Video Processing**: Extract transcripts from YouTube videos and create recap videos with translations and voiceovers.
• **Translation**: AI-powered translation to Burmese and other supported languages.
• **Voice Generation**: Text-to-speech conversion using Microsoft Neural TTS technology.
• **Cloud Storage**: Temporary storage of generated videos for download.

We reserve the right to modify, suspend, or discontinue any part of our services at any time with or without notice.`
  },
  {
    id: 'accounts',
    icon: Users,
    title: 'User Accounts',
    content: `When you create an account with us, you agree to:

• **Accurate Information**: Provide accurate, current, and complete information during registration.
• **Account Security**: Maintain the security of your password and accept responsibility for all activities under your account.
• **Notification**: Promptly notify us of any unauthorized use of your account.
• **One Account**: Maintain only one account per person unless explicitly authorized.

We reserve the right to suspend or terminate accounts that violate these terms or engage in suspicious activity.`
  },
  {
    id: 'credits',
    icon: CreditCard,
    title: 'Credits & Payments',
    content: `Our service operates on a credit-based system:

• **Credit Purchases**: Credits can be purchased through our supported payment methods (KBZ Pay, Wave Pay, bank transfer).
• **Credit Usage**: Each video creation consumes one credit, regardless of video length or complexity.
• **No Refunds**: Credits are non-refundable once purchased, except as required by law.
• **Expiration**: Credits do not expire as long as your account remains active.
• **Free Credits**: Promotional free credits may have different terms and may expire.

Prices are subject to change with reasonable notice.`
  },
  {
    id: 'acceptable-use',
    icon: AlertTriangle,
    title: 'Acceptable Use Policy',
    content: `You agree NOT to use our services to:

• **Copyright Infringement**: Process videos you don't have rights to or create content that infringes on others' intellectual property.
• **Illegal Content**: Create content that is illegal, harmful, threatening, abusive, or hateful.
• **Spam or Fraud**: Use our services for spam, phishing, or fraudulent purposes.
• **System Abuse**: Attempt to bypass rate limits, abuse free credits, or manipulate our systems.
• **Harmful Activities**: Create content that promotes violence, discrimination, or illegal activities.

We reserve the right to remove content and terminate accounts that violate these policies.`
  },
  {
    id: 'intellectual-property',
    icon: Scale,
    title: 'Intellectual Property',
    content: `Regarding intellectual property rights:

• **Your Content**: You retain ownership of any content you upload or create using our services.
• **License Grant**: By using our services, you grant us a limited license to process your content as necessary to provide the service.
• **Our Service**: RecapVideo.AI, including its design, features, and technology, is our intellectual property.
• **YouTube Content**: You are responsible for ensuring you have the right to use any YouTube content you process.

We respect intellectual property rights and expect our users to do the same.`
  },
  {
    id: 'limitations',
    icon: Ban,
    title: 'Limitations of Liability',
    content: `To the maximum extent permitted by law:

• **No Warranty**: Our services are provided "as is" without warranties of any kind, express or implied.
• **Limited Liability**: We are not liable for any indirect, incidental, special, consequential, or punitive damages.
• **Maximum Liability**: Our total liability shall not exceed the amount you paid us in the past 12 months.
• **Third-Party Content**: We are not responsible for content created by third parties or the accuracy of AI-generated translations.

Some jurisdictions do not allow certain limitations, so some of these may not apply to you.`
  },
  {
    id: 'termination',
    icon: RefreshCw,
    title: 'Termination',
    content: `Regarding account termination:

• **By You**: You may terminate your account at any time by contacting us.
• **By Us**: We may terminate or suspend your account for violations of these terms, suspicious activity, or for any reason with notice.
• **Effect**: Upon termination, your right to use the service ceases immediately, and we may delete your data.
• **Survival**: Provisions regarding intellectual property, limitations of liability, and disputes survive termination.

Unused credits are not refundable upon termination.`
  },
  {
    id: 'disputes',
    icon: Gavel,
    title: 'Dispute Resolution',
    content: `In case of disputes:

• **Informal Resolution**: We encourage you to contact us first to resolve any issues informally.
• **Governing Law**: These terms are governed by the laws of Myanmar.
• **Jurisdiction**: Any disputes shall be resolved in the courts of Yangon, Myanmar.
• **Time Limit**: Any claim must be brought within one year of the cause of action.

We are committed to resolving disputes fairly and efficiently.`
  },
  {
    id: 'contact',
    icon: MessageSquare,
    title: 'Contact Information',
    content: `For questions about these Terms of Service:

• **Email**: legal@recapvideo.ai
• **Telegram**: @recapvideo
• **Address**: Yangon, Myanmar

We aim to respond to all legal inquiries within 5 business days.`
  }
];

export default function TermsPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-pink-500/10 text-pink-400 border-pink-500/20">
            <FileText className="mr-1 h-3 w-3" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Please read these terms carefully before using our service.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 2025
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <p className="text-muted-foreground leading-relaxed">
            Welcome to RecapVideo.AI! These Terms of Service (&quot;Terms&quot;) govern your access 
            to and use of our video recap generation services, including our website, APIs, 
            and any related services (collectively, the &quot;Service&quot;). By using our Service, 
            you agree to comply with and be bound by these Terms.
          </p>
        </motion.div>

        {/* Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {termsSections.map((section, index) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="glass rounded-xl border-white/10 px-6 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-violet-600/20 to-pink-600/20 flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-pink-400" />
                    </div>
                    <span className="text-lg font-semibold text-left">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="pl-14 text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            By using RecapVideo.AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
