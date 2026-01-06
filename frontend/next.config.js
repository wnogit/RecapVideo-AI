/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    domains: ['videos.recapvideo.ai', 'recapvideo.ai'],
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
  },
  
  // Redirect www to non-www
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.recapvideo.ai' }],
        destination: 'https://recapvideo.ai/:path*',
        permanent: true,
      },
    ];
  },
  
  // Output standalone for Docker
  output: 'standalone',
};

module.exports = nextConfig;
