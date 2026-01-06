"""
Transcript Service - YouTube transcript extraction using TranscriptAPI.com
"""
import httpx
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class TranscriptService:
    """Service for extracting YouTube transcripts via TranscriptAPI.com"""
    
    def __init__(self):
        """Initialize transcript service."""
        self.base_url = settings.TRANSCRIPT_API_URL
    
    async def _get_api_key(self) -> str:
        """Get API key from database or environment."""
        key = await api_key_service.get_transcript_api_key()
        if not key:
            raise ValueError("TranscriptAPI key not configured")
        return key
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """
        Extract YouTube video ID from URL.
        
        Supports:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/shorts/VIDEO_ID
        """
        import re
        
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    async def get_transcript(
        self,
        video_url: str,
        language: str = "en",
    ) -> dict:
        """
        Get transcript for a YouTube video.
        
        Args:
            video_url: YouTube video URL
            language: Preferred language code
        
        Returns:
            Dict with transcript data including:
            - text: Full transcript text
            - segments: List of timed segments
            - language: Detected language
            - duration: Video duration in seconds
        """
        video_id = self.extract_video_id(video_url)
        
        if not video_id:
            raise ValueError("Invalid YouTube URL")
        
        logger.info(f"Fetching transcript for video: {video_id}")
        
        # Get API key from database
        api_key = await self._get_api_key()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/v1/transcript",
                    params={
                        "video_id": video_id,
                        "lang": language,
                    },
                    headers={
                        "Authorization": f"Bearer {api_key}",
                    },
                )
                
                response.raise_for_status()
                data = response.json()
                
                # Format response
                segments = data.get("transcript", [])
                full_text = " ".join([s.get("text", "") for s in segments])
                
                return {
                    "video_id": video_id,
                    "text": full_text,
                    "segments": segments,
                    "language": data.get("language", language),
                    "duration": data.get("duration", 0),
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"TranscriptAPI error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Failed to fetch transcript: {e}")
            raise
    
    async def get_video_info(self, video_url: str) -> dict:
        """
        Get basic video information.
        
        Returns:
            Dict with video info including title, thumbnail, duration
        """
        video_id = self.extract_video_id(video_url)
        
        if not video_id:
            raise ValueError("Invalid YouTube URL")
        
        # For now, use yt-dlp for video info
        # TranscriptAPI might also provide this
        try:
            import yt_dlp
            
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                
                return {
                    "video_id": video_id,
                    "title": info.get("title"),
                    "thumbnail": info.get("thumbnail"),
                    "duration": info.get("duration"),
                    "uploader": info.get("uploader"),
                    "view_count": info.get("view_count"),
                }
                
        except Exception as e:
            logger.error(f"Failed to get video info: {e}")
            raise


# Singleton instance
transcript_service = TranscriptService()
