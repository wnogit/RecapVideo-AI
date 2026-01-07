/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: [
      'videos.recapvideo.ai',
      'cdn.recapvideo.ai',
      'recapvideo.ai',
      'app.recapvideo.ai',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.recapvideo.ai',
      },
    ],
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MAIN_URL: process.env.NEXT_PUBLIC_MAIN_URL,
  },
  
  // Redirects for subdomain handling
  async redirects() {
    return [
      // Redirect www to non-www for main domain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.recapvideo.ai' }],
        destination: 'https://recapvideo.ai/:path*',
        permanent: true,
      },
      // Redirect www.app to app subdomain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.app.recapvideo.ai' }],
        destination: 'https://app.recapvideo.ai/:path*',
        permanent: true,
      },
    ];
  },
  
  // Output standalone for Docker
  output: 'standalone',
};

module.exports = nextConfig;
