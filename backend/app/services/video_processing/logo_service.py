"""
Video Processing - Logo Service
Logo overlay and image handling
"""
import base64
from pathlib import Path
from typing import Optional

import httpx
from loguru import logger

from .models import LogoOptions
from .ffmpeg_utils import FFmpegUtils


class LogoService:
    """
    Service for logo overlay operations.
    Handles URL downloads, base64 decoding, and FFmpeg overlay.
    
    Video Format Info:
    - Logo formats: PNG, JPG, GIF, WebP
    - Output: MP4 (H.264) with transparent logo overlay
    - Opacity: 0-100%
    """
    
    # Logo sizes in pixels
    LOGO_SIZES = {
        "small": 60,
        "medium": 80,
        "large": 120,
    }
    
    def __init__(self, ffmpeg_utils: FFmpegUtils):
        self.ffmpeg = ffmpeg_utils
    
    async def add_logo(
        self,
        video_path: str,
        options: LogoOptions,
        work_dir: Path,
    ) -> str:
        """
        Add logo overlay to video.
        
        Video Format:
        - Uses filter_complex for overlay
        - Supports PNG transparency
        - Output codec: H.264 (libx264)
        """
        output_path = work_dir / "with_logo.mp4"
        logo_size = self.LOGO_SIZES.get(options.size, 80)
        
        # Download logo if it's a URL
        logo_path = await self._ensure_local_logo(options.image_path, work_dir)
        if not logo_path:
            logger.warning("Logo path invalid, skipping logo overlay")
            return video_path
        
        # Position mapping
        positions = {
            "top-left": "x=20:y=20",
            "top-right": "x=main_w-overlay_w-20:y=20",
            "bottom-left": "x=20:y=main_h-overlay_h-20",
            "bottom-right": "x=main_w-overlay_w-20:y=main_h-overlay_h-20",
        }
        pos = positions.get(options.position, positions["top-right"])
        
        # Opacity filter
        opacity = options.opacity / 100
        
        # Overlay filter
        filter_str = f"[1:v]scale={logo_size}:-1,format=rgba,colorchannelmixer=aa={opacity}[logo];[0:v][logo]overlay={pos}"
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-i", video_path,
            "-i", logo_path,
            "-filter_complex", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
    
    async def _ensure_local_logo(self, logo_path: str, work_dir: Path) -> Optional[str]:
        """
        Ensure logo is available locally.
        Handles: URLs (http/https), base64 data URLs, local paths.
        """
        if not logo_path:
            return None
        
        # Check if it's a base64 data URL
        if logo_path.startswith("data:image/"):
            try:
                logger.info("Decoding base64 logo image")
                header, data = logo_path.split(",", 1)
                
                if "png" in header:
                    ext = ".png"
                elif "gif" in header:
                    ext = ".gif"
                elif "webp" in header:
                    ext = ".webp"
                else:
                    ext = ".jpg"
                
                local_path = work_dir / f"logo{ext}"
                image_data = base64.b64decode(data)
                with open(local_path, "wb") as f:
                    f.write(image_data)
                
                logger.info(f"Base64 logo saved to: {local_path}")
                return str(local_path)
                
            except Exception as e:
                logger.error(f"Failed to decode base64 logo: {e}")
                return None
        
        # Check if it's a URL
        if logo_path.startswith(("http://", "https://")):
            try:
                logger.info(f"Downloading logo from: {logo_path}")
                async with httpx.AsyncClient() as client:
                    response = await client.get(logo_path, timeout=30.0)
                    response.raise_for_status()
                    
                    content_type = response.headers.get("content-type", "")
                    if "png" in content_type or logo_path.endswith(".png"):
                        ext = ".png"
                    elif "gif" in content_type or logo_path.endswith(".gif"):
                        ext = ".gif"
                    else:
                        ext = ".jpg"
                    
                    local_path = work_dir / f"logo{ext}"
                    with open(local_path, "wb") as f:
                        f.write(response.content)
                    
                    logger.info(f"Logo downloaded to: {local_path}")
                    return str(local_path)
                    
            except Exception as e:
                logger.error(f"Failed to download logo: {e}")
                return None
        
        # Local path - verify it exists
        if Path(logo_path).exists():
            return logo_path
        
        logger.warning(f"Logo file not found: {logo_path}")
        return None
