/**
 * Video URL Utilities
 * Multi-platform URL validation and detection for YouTube, TikTok, and Facebook
 */

export type VideoPlatform = 'youtube' | 'tiktok' | 'facebook' | 'unknown';

// YouTube Shorts URL patterns
export const YOUTUBE_SHORTS_PATTERNS = [
    /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
    /^https?:\/\/m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
    /^(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
    /^m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
];

// Regular YouTube URL patterns (not Shorts)
export const REGULAR_YOUTUBE_PATTERNS = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^youtu\.be\/([a-zA-Z0-9_-]{11})/,
];

// TikTok URL patterns
export const TIKTOK_PATTERNS = [
    /^https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /^https?:\/\/(?:vm\.)?tiktok\.com\/([\w]+)/,
    /^https?:\/\/(?:www\.)?tiktok\.com\/t\/([\w]+)/,
];

// Facebook URL patterns
export const FACEBOOK_PATTERNS = [
    /^https?:\/\/(?:www\.)?facebook\.com\/.+\/videos\/(\d+)/,
    /^https?:\/\/(?:www\.)?facebook\.com\/watch\/?\?v=(\d+)/,
    /^https?:\/\/(?:www\.)?facebook\.com\/reel\/(\d+)/,
    /^https?:\/\/fb\.watch\/([\w]+)/,
];

/**
 * Detect platform and extract video ID from URL
 */
export function detectPlatform(url: string): { platform: VideoPlatform; videoId: string | null } {
    const trimmedUrl = url.trim();

    // Check YouTube Shorts first
    for (const pattern of YOUTUBE_SHORTS_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match) {
            return { platform: 'youtube', videoId: match[1] };
        }
    }

    // Check regular YouTube
    for (const pattern of REGULAR_YOUTUBE_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match) {
            return { platform: 'youtube', videoId: match[1] };
        }
    }

    // Check TikTok
    for (const pattern of TIKTOK_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match) {
            return { platform: 'tiktok', videoId: match[1] };
        }
    }

    // Check Facebook
    for (const pattern of FACEBOOK_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match) {
            return { platform: 'facebook', videoId: match[1] };
        }
    }

    return { platform: 'unknown', videoId: null };
}

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
    const { platform } = detectPlatform(url);
    return platform === 'youtube';
}

/**
 * Check if URL is a TikTok video URL
 */
export function isTiktokUrl(url: string): boolean {
    const { platform } = detectPlatform(url);
    return platform === 'tiktok';
}

/**
 * Check if URL is a Facebook video URL
 */
export function isFacebookUrl(url: string): boolean {
    const { platform } = detectPlatform(url);
    return platform === 'facebook';
}

/**
 * Check if URL is from any supported platform
 */
export function isSupportedUrl(url: string): boolean {
    const { platform } = detectPlatform(url);
    return platform !== 'unknown';
}

/**
 * Extract video ID from any supported platform URL
 */
export function extractVideoId(url: string): string | null {
    const { videoId } = detectPlatform(url);
    return videoId;
}

/**
 * Validate video URL and return validation result
 */
export function validateVideoUrl(url: string): {
    valid: boolean;
    platform?: VideoPlatform;
    videoId?: string;
    error?: string
} {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return { valid: false, error: 'Please enter a video URL' };
    }

    const { platform, videoId } = detectPlatform(trimmedUrl);

    if (platform === 'unknown') {
        return {
            valid: false,
            error: 'Invalid URL. Please enter a YouTube, TikTok, or Facebook video URL.'
        };
    }

    return { valid: true, platform, videoId: videoId || undefined };
}

/**
 * Get platform display info (icon, name, color)
 */
export function getPlatformInfo(platform: VideoPlatform): {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
} {
    switch (platform) {
        case 'youtube':
            return {
                name: 'YouTube',
                icon: '▶️',
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-950/20',
            };
        case 'tiktok':
            return {
                name: 'TikTok',
                icon: '🎵',
                color: 'text-black dark:text-white',
                bgColor: 'bg-gray-100 dark:bg-gray-800',
            };
        case 'facebook':
            return {
                name: 'Facebook',
                icon: '📘',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            };
        default:
            return {
                name: 'Unknown',
                icon: '❓',
                color: 'text-gray-500',
                bgColor: 'bg-gray-100',
            };
    }
}
