import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HelpCircle, 
  CreditCard, 
  Video, 
  Languages, 
  Download, 
  Shield,
  Clock,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ - RecapVideo.AI',
  description: 'Frequently Asked Questions about RecapVideo.AI',
};

const faqs = [
  {
    icon: Video,
    question: 'How does RecapVideo.AI work?',
    answer: 'Simply paste a YouTube video URL, choose your settings (language, voice type), and our AI will extract the transcript, translate it, generate voiceover, and create a new video recap. The entire process takes just a few minutes.',
  },
  {
    icon: Languages,
    question: 'What languages do you support?',
    answer: 'We currently support Burmese (Myanmar) as the primary output language, with natural-sounding AI voices. We plan to add more languages including Thai, Chinese, Vietnamese, and Hindi in the future.',
  },
  {
    icon: CreditCard,
    question: 'How do credits work?',
    answer: 'Each credit allows you to create one video recap. New users get 3 free credits upon signup. You can purchase additional credits through our pricing plans. Credits never expire.',
  },
  {
    icon: Clock,
    question: 'How long does video processing take?',
    answer: 'Processing time depends on the source video length. A typical 10-minute YouTube video takes about 2-5 minutes to process. You\'ll receive a notification when your video is ready.',
  },
  {
    icon: Download,
    question: 'Can I download my videos?',
    answer: 'Yes! All videos are stored in your cloud storage and can be downloaded anytime. Videos are available in MP4 format optimized for social media platforms.',
  },
  {
    icon: Shield,
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure cloud storage, and never share your personal data. Your videos are private and only accessible to you.',
  },
  {
    icon: Zap,
    question: 'What\'s the maximum video length?',
    answer: 'Currently, we support YouTube videos up to 30 minutes long. For longer videos, we recommend splitting them into shorter segments for better recap quality.',
  },
  {
    icon: HelpCircle,
    question: 'What if my video fails to process?',
    answer: 'If a video fails to process, your credit will be automatically refunded. Common issues include unavailable transcripts or region-restricted videos. Contact support if you need help.',
  },
];

export default function FAQPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about RecapVideo.AI. 
          Can&apos;t find what you&apos;re looking for? Contact our support team.
        </p>
      </div>

      <div className="grid gap-6">
        {faqs.map((faq, index) => {
          const Icon = faq.icon;
          return (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start gap-3 text-lg">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="pt-1">{faq.question}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-16">
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Still have questions? */}
      <div className="mt-12 text-center p-8 bg-muted/50 rounded-2xl">
        <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">
          We&apos;re here to help. Contact our support team for personalized assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/contact" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Contact Support
          </a>
          <a 
            href="mailto:support@recapvideo.ai" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
