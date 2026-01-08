'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Database, UserCheck, Globe, Bell, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const privacySections = [
  {
    id: 'information-collection',
    icon: Database,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, such as:

• **Account Information**: When you create an account, we collect your name, email address, and password.
• **Payment Information**: When you make a purchase, we collect payment details through our secure payment processors (KBZ Pay, Wave Pay).
• **Usage Data**: We collect information about how you use our services, including videos processed, features used, and preferences.
• **Device Information**: We may collect information about the device you use to access our services, including browser type, operating system, and IP address.

We do NOT store your payment card information directly - all payments are processed through secure third-party payment providers.`
  },
  {
    id: 'information-use',
    icon: Eye,
    title: 'How We Use Your Information',
    content: `We use the information we collect to:

• **Provide Services**: Process your video requests, manage your account, and deliver the features you use.
• **Improve Our Services**: Analyze usage patterns to improve our AI algorithms and user experience.
• **Communicate With You**: Send you service updates, security alerts, and support messages.
• **Process Payments**: Handle credit purchases and maintain transaction records.
• **Prevent Fraud**: Detect and prevent fraudulent activity and abuse of our services.

We never sell your personal information to third parties.`
  },
  {
    id: 'data-security',
    icon: Lock,
    title: 'Data Security',
    content: `We implement industry-standard security measures to protect your data:

• **Encryption**: All data is encrypted in transit using TLS/SSL and at rest using AES-256 encryption.
• **Secure Storage**: Videos and user data are stored on secure cloud infrastructure with regular security audits.
• **Access Control**: Only authorized personnel have access to user data, and access is logged and monitored.
• **Regular Updates**: We regularly update our security practices to address new threats.

Despite our efforts, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`
  },
  {
    id: 'data-retention',
    icon: Database,
    title: 'Data Retention',
    content: `We retain your information for as long as necessary to provide our services:

• **Account Data**: Retained while your account is active and for a reasonable period afterward.
• **Processed Videos**: Stored for 30 days after creation, then automatically deleted unless you choose to keep them.
• **Transaction Records**: Retained for 7 years as required by law.
• **Usage Logs**: Anonymized after 90 days.

You can request deletion of your account and associated data at any time by contacting us.`
  },
  {
    id: 'user-rights',
    icon: UserCheck,
    title: 'Your Rights',
    content: `You have the following rights regarding your personal data:

• **Access**: Request a copy of the personal data we hold about you.
• **Correction**: Request correction of inaccurate or incomplete data.
• **Deletion**: Request deletion of your personal data.
• **Portability**: Request a copy of your data in a portable format.
• **Objection**: Object to certain processing of your data.

To exercise these rights, please contact us at privacy@recapvideo.ai.`
  },
  {
    id: 'cookies',
    icon: Globe,
    title: 'Cookies & Tracking',
    content: `We use cookies and similar technologies for:

• **Essential Cookies**: Required for the website to function properly (authentication, security).
• **Analytics Cookies**: Help us understand how visitors use our site (anonymized).
• **Preference Cookies**: Remember your settings and preferences.

You can manage cookie preferences through your browser settings. Disabling certain cookies may affect your ability to use some features.`
  },
  {
    id: 'updates',
    icon: Bell,
    title: 'Policy Updates',
    content: `We may update this Privacy Policy from time to time. When we do:

• We will post the updated policy on this page with a new "Last Updated" date.
• For significant changes, we will notify you via email or a prominent notice on our website.
• Your continued use of our services after changes take effect constitutes acceptance of the updated policy.

We encourage you to review this policy periodically.`
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contact Us',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us:

• **Email**: privacy@recapvideo.ai
• **Telegram**: @recapvideo
• **Address**: Yangon, Myanmar

We aim to respond to all inquiries within 48 hours.`
  }
];

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
            <Shield className="mr-1 h-3 w-3" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Your privacy matters to us. Learn how we protect and handle your data.
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
            RecapVideo.AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our video recap generation service. Please read this 
            policy carefully to understand our practices regarding your personal data.
          </p>
        </motion.div>

        {/* Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {privacySections.map((section, index) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="glass rounded-xl border-white/10 px-6 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-violet-600/20 to-pink-600/20 flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-violet-400" />
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
            By using RecapVideo.AI, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
