/**
 * YouTube URL Utilities
 * Shared validation and extraction functions for YouTube URLs
 */

// YouTube Shorts URL patterns
export const YOUTUBE_SHORTS_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^https?:\/\/m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
];

// Regular YouTube URL patterns (not Shorts)
export const REGULAR_YOUTUBE_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

/**
 * Check if URL is a YouTube Shorts URL
 */
export function isYoutubeShortsUrl(url: string): boolean {
  return YOUTUBE_SHORTS_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if URL is a regular YouTube video (not Shorts)
 */
export function isRegularYoutubeUrl(url: string): boolean {
  return REGULAR_YOUTUBE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if URL is any valid YouTube URL
 */
export function isYoutubeUrl(url: string): boolean {
  return isYoutubeShortsUrl(url) || isRegularYoutubeUrl(url);
}

/**
 * Extract video ID from any YouTube URL
 */
export function extractYoutubeId(url: string): string | null {
  // Try Shorts patterns first
  for (const pattern of YOUTUBE_SHORTS_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Try regular YouTube patterns
  for (const pattern of REGULAR_YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate YouTube Shorts URL and return video ID or error
 */
export function validateYoutubeShortsUrl(url: string): { valid: boolean; videoId?: string; error?: string } {
  const trimmedUrl = url.trim();
  
  for (const pattern of YOUTUBE_SHORTS_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { valid: true, videoId: match[1] };
    }
  }
  
  // Check if it's a regular YouTube video (to give specific error)
  if (isRegularYoutubeUrl(trimmedUrl)) {
    return { 
      valid: false, 
      error: "Only YouTube Shorts are supported. Please use a youtube.com/shorts/ link."
    };
  }
  
  return { 
    valid: false, 
    error: "Invalid URL. Please enter a valid YouTube Shorts URL (youtube.com/shorts/...)"
  };
}
