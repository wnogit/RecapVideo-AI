// Site configuration
export const siteConfig = {
  // Main landing page domain
  landingUrl: process.env.NEXT_PUBLIC_LANDING_URL || 'https://recapvideo.ai',
  
  // Studio/App domain for authenticated users
  studioUrl: process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.recapvideo.ai',
  
  // API domain
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.recapvideo.ai',
};

// Helper to get studio URLs
export const studioUrls = {
  login: `${siteConfig.studioUrl}/login`,
  signup: `${siteConfig.studioUrl}/signup`,
  dashboard: `${siteConfig.studioUrl}/dashboard`,
  profile: `${siteConfig.studioUrl}/profile`,
};
