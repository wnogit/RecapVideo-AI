"""
Video URL Utilities
Multi-platform URL validation and extraction for YouTube, TikTok, and Facebook
"""
import re
from typing import Optional, Tuple
from enum import Enum


class Platform(str, Enum):
    """Supported video platforms."""
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"
    UNKNOWN = "unknown"


# YouTube URL patterns
YOUTUBE_SHORTS_PATTERNS = [
    r'^https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
    r'^https?://m\.youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
]

REGULAR_YOUTUBE_PATTERNS = [
    r'^https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
    r'^https?://youtu\.be/([a-zA-Z0-9_-]{11})',
    r'^https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
]

ALL_YOUTUBE_PATTERNS = YOUTUBE_SHORTS_PATTERNS + REGULAR_YOUTUBE_PATTERNS

# TikTok URL patterns
TIKTOK_PATTERNS = [
    r'^https?://(?:www\.)?tiktok\.com/@[\w.-]+/video/(\d+)',
    r'^https?://(?:vm\.)?tiktok\.com/([\w]+)',
    r'^https?://(?:www\.)?tiktok\.com/t/([\w]+)',
]

# Facebook URL patterns
FACEBOOK_PATTERNS = [
    r'^https?://(?:www\.)?facebook\.com/.+/videos/(\d+)',
    r'^https?://(?:www\.)?facebook\.com/watch/?\?v=(\d+)',
    r'^https?://(?:www\.)?facebook\.com/reel/(\d+)',
    r'^https?://fb\.watch/([\w]+)',
]


def detect_platform(url: str) -> Tuple[Platform, Optional[str]]:
    """
    Detect platform and extract video ID from URL.
    
    Args:
        url: Video URL
        
    Returns:
        (Platform, video_id or None)
    """
    url = url.strip()
    
    # Check YouTube
    for pattern in ALL_YOUTUBE_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return Platform.YOUTUBE, match.group(1)
    
    # Check TikTok
    for pattern in TIKTOK_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return Platform.TIKTOK, match.group(1)
    
    # Check Facebook
    for pattern in FACEBOOK_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return Platform.FACEBOOK, match.group(1)
    
    return Platform.UNKNOWN, None


def is_youtube_url(url: str) -> bool:
    """Check if URL is any valid YouTube URL."""
    platform, _ = detect_platform(url)
    return platform == Platform.YOUTUBE


def is_youtube_shorts_url(url: str) -> bool:
    """Check if URL is specifically a YouTube Shorts URL."""
    url = url.strip()
    return any(re.match(pattern, url) for pattern in YOUTUBE_SHORTS_PATTERNS)


def is_regular_youtube_url(url: str) -> bool:
    """Check if URL is a regular YouTube video (not Shorts)."""
    url = url.strip()
    return any(re.match(pattern, url) for pattern in REGULAR_YOUTUBE_PATTERNS)


def is_tiktok_url(url: str) -> bool:
    """Check if URL is a TikTok video URL."""
    platform, _ = detect_platform(url)
    return platform == Platform.TIKTOK


def is_facebook_url(url: str) -> bool:
    """Check if URL is a Facebook video URL."""
    platform, _ = detect_platform(url)
    return platform == Platform.FACEBOOK


def extract_youtube_id(url: str) -> Optional[str]:
    """
    Extract video ID from any YouTube URL.
    
    Returns:
        Video ID string or None if not found
    """
    platform, video_id = detect_platform(url)
    if platform == Platform.YOUTUBE:
        return video_id
    return None


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract video ID from any supported platform URL.
    
    Returns:
        Video ID string or None if not found
    """
    _, video_id = detect_platform(url)
    return video_id


def validate_video_url(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate that URL is from a supported platform.
    
    Returns:
        (is_valid, platform, video_id or error_message)
    """
    url = url.strip()
    
    if not url:
        return False, None, "Please enter a video URL"
    
    platform, video_id = detect_platform(url)
    
    if platform == Platform.UNKNOWN:
        return False, None, "Invalid URL. Please enter a YouTube, TikTok, or Facebook video URL."
    
    return True, platform.value, video_id


def validate_youtube_shorts_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that URL is a YouTube Shorts URL.
    
    Returns:
        (is_valid, video_id or error_message)
    """
    url = url.strip()
    
    for pattern in YOUTUBE_SHORTS_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return True, match.group(1)
    
    # Check if it's a regular YouTube video
    if is_regular_youtube_url(url):
        return False, "Only YouTube Shorts are supported. Please use a youtube.com/shorts/ link."
    
    return False, "Invalid URL. Please enter a valid YouTube Shorts URL (youtube.com/shorts/...)"


# Video duration utilities
import asyncio
from loguru import logger

MAX_VIDEO_DURATION_SECONDS = 300  # 5 minutes


async def get_video_duration(url: str) -> Optional[float]:
    """
    Get video duration using yt-dlp.
    
    Args:
        url: Video URL (any supported platform)
        
    Returns:
        Duration in seconds or None if failed
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp", "--no-download", "--print", "duration", url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
        if proc.returncode == 0:
            duration_str = stdout.decode().strip()
            if duration_str:
                return float(duration_str)
        else:
            logger.warning(f"yt-dlp failed for {url}: {stderr.decode()}")
    except asyncio.TimeoutError:
        logger.warning(f"yt-dlp timeout for {url}")
    except Exception as e:
        logger.error(f"Error getting duration for {url}: {e}")
    return None


def validate_video_duration(duration: Optional[float]) -> Tuple[bool, Optional[str]]:
    """
    Validate video duration is within limits.
    
    Args:
        duration: Duration in seconds
        
    Returns:
        (is_valid, error_message if invalid)
    """
    if duration is None:
        return True, None
    if duration > MAX_VIDEO_DURATION_SECONDS:
        minutes = MAX_VIDEO_DURATION_SECONDS // 60
        return False, f"Video duration ({int(duration)}s) exceeds maximum allowed ({minutes} minutes)."
    return True, None
