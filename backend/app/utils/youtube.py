"""
YouTube URL Utilities
Shared validation and extraction functions for YouTube URLs
"""
import re
from typing import Optional, Tuple


# YouTube Shorts URL patterns
YOUTUBE_SHORTS_PATTERNS = [
    r'^https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
    r'^https?://m\.youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:\?.*)?$',
]

# Regular YouTube URL patterns (not Shorts)
REGULAR_YOUTUBE_PATTERNS = [
    r'^https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
    r'^https?://youtu\.be/([a-zA-Z0-9_-]{11})',
    r'^https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    r'^https?://(?:www\.)?youtube\.com/playlist',
]

# All YouTube URL patterns (for general validation)
ALL_YOUTUBE_PATTERNS = [
    r'(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
    r'(https?://)?(www\.)?youtu\.be/[\w-]+',
    r'(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
]


def is_youtube_url(url: str) -> bool:
    """Check if URL is any valid YouTube URL."""
    return any(re.match(pattern, url) for pattern in ALL_YOUTUBE_PATTERNS)


def is_youtube_shorts_url(url: str) -> bool:
    """Check if URL is specifically a YouTube Shorts URL."""
    url = url.strip()
    return any(re.match(pattern, url) for pattern in YOUTUBE_SHORTS_PATTERNS)


def is_regular_youtube_url(url: str) -> bool:
    """Check if URL is a regular YouTube video (not Shorts)."""
    url = url.strip()
    return any(re.match(pattern, url) for pattern in REGULAR_YOUTUBE_PATTERNS)


def extract_youtube_id(url: str) -> Optional[str]:
    """
    Extract video ID from any YouTube URL.
    
    Returns:
        Video ID string or None if not found
    """
    url = url.strip()
    
    # Try Shorts patterns first
    for pattern in YOUTUBE_SHORTS_PATTERNS:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    
    # Try regular YouTube patterns
    for pattern in REGULAR_YOUTUBE_PATTERNS[:-1]:  # Exclude playlist pattern
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    
    return None


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
    
    # Check if it's a regular YouTube video (to give specific error)
    if is_regular_youtube_url(url):
        return False, "Only YouTube Shorts are supported. Please use a youtube.com/shorts/ link."
    
    return False, "Invalid URL. Please enter a valid YouTube Shorts URL (youtube.com/shorts/...)"


# VP8: Video duration check - Added by Copilot
import asyncio
from loguru import logger

# Maximum video duration in seconds (5 minutes)
MAX_VIDEO_DURATION_SECONDS = 300


async def get_video_duration(video_id: str) -> Optional[float]:
    """
    Get video duration using yt-dlp.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Duration in seconds or None if failed
    """
    try:
        url = f"https://www.youtube.com/shorts/{video_id}"
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
            logger.warning(f"yt-dlp failed for {video_id}: {stderr.decode()}")
    except asyncio.TimeoutError:
        logger.warning(f"yt-dlp timeout for {video_id}")
    except Exception as e:
        logger.error(f"Error getting duration for {video_id}: {e}")
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
