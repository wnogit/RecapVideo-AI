'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Mail, 
  Send, 
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Send us an email anytime',
    value: 'support@recapvideo.ai',
    href: 'mailto:support@recapvideo.ai',
    color: 'text-blue-400',
    bgColor: 'from-blue-600/20 to-cyan-600/20'
  },
  {
    icon: Send,
    title: 'Telegram',
    description: 'Quick responses on Telegram',
    value: '@recapvideo',
    href: 'https://t.me/recapvideo',
    color: 'text-sky-400',
    bgColor: 'from-sky-600/20 to-blue-600/20'
  },
  {
    icon: Clock,
    title: 'Response Time',
    description: 'We typically respond within',
    value: '24 hours',
    color: 'text-green-400',
    bgColor: 'from-green-600/20 to-emerald-600/20'
  },
  {
    icon: MapPin,
    title: 'Location',
    description: 'Based in',
    value: 'Yangon, Myanmar',
    color: 'text-pink-400',
    bgColor: 'from-pink-600/20 to-rose-600/20'
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
            <MessageSquare className="mr-1 h-3 w-3" />
            Contact
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have a question or need help? We&apos;re here to assist you. 
            Reach out and we&apos;ll respond as soon as we can.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.href.startsWith('http') ? '_blank' : undefined}
                      className="block glass rounded-xl p-6 hover:bg-white/10 transition-all duration-300 h-full group"
                    >
                      <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${method.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <method.icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <h3 className="font-semibold mb-1">{method.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <p className={`font-medium ${method.color}`}>{method.value}</p>
                    </a>
                  ) : (
                    <div className="glass rounded-xl p-6 h-full">
                      <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${method.bgColor} flex items-center justify-center mb-4`}>
                        <method.icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <h3 className="font-semibold mb-1">{method.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <p className={`font-medium ${method.color}`}>{method.value}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 glass rounded-xl p-6"
            >
              <h3 className="font-semibold mb-3">Before You Contact Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-1">•</span>
                  Check our <a href="/faq" className="text-violet-400 hover:text-violet-300 underline">FAQ page</a> for quick answers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-1">•</span>
                  For account issues, include your registered email
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-1">•</span>
                  For video issues, include the video URL and error message
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-1">•</span>
                  Payment issues are typically resolved within 24 hours
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl" />
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 relative"
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    variant="outline"
                    className="glass border-white/20 hover:bg-white/10"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-6 relative">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="glass border-white/20 focus:border-violet-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="glass border-white/20 focus:border-violet-500/50"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="glass border-white/20 focus:border-violet-500/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your question or issue..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        className="glass border-white/20 focus:border-violet-500/50 resize-none"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg h-12"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
