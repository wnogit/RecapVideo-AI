import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RecapVideo.AI - Transform YouTube Shorts to Burmese',
  description: 'AI-powered video translation and dubbing service. Convert English YouTube Shorts to Burmese with natural-sounding voices.',
  keywords: ['RecapVideo', 'AI', 'video translation', 'Burmese', 'Myanmar', 'YouTube Shorts', 'dubbing'],
  authors: [{ name: 'RecapVideo.AI' }],
  openGraph: {
    title: 'RecapVideo.AI - Transform YouTube Shorts to Burmese',
    description: 'AI-powered video translation and dubbing service',
    url: 'https://recapvideo.ai',
    siteName: 'RecapVideo.AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
