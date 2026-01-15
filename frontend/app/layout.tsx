import type { Metadata } from 'next';
import { Inter, Noto_Sans_Myanmar } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ['myanmar'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-myanmar',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RecapVideo.AI - Transform YouTube Shorts to Burmese',
  description: 'AI-powered video translation and dubbing service. Convert English YouTube Shorts to Burmese with natural-sounding voices.',
  keywords: ['RecapVideo', 'AI', 'video translation', 'Burmese', 'Myanmar', 'YouTube Shorts', 'dubbing'],
  authors: [{ name: 'RecapVideo.AI' }],
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'RecapVideo.AI - Transform YouTube Shorts to Burmese',
    description: 'AI-powered video translation and dubbing service',
    url: 'https://recapvideo.ai',
    siteName: 'RecapVideo.AI',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'RecapVideo.AI Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansMyanmar.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
