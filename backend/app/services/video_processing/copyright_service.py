"""
Video Processing - Copyright Service
Copyright bypass filters
"""
from pathlib import Path
from loguru import logger

from .models import CopyrightOptions
from .ffmpeg_utils import FFmpegUtils


class CopyrightService:
    """
    Service for copyright bypass filters.
    Applies visual modifications to avoid content ID.
    
    Video Format Info:
    - Color adjustment: brightness, contrast, saturation
    - Horizontal flip
    - Slight zoom (105%)
    """
    
    def __init__(self, ffmpeg_utils: FFmpegUtils):
        self.ffmpeg = ffmpeg_utils
    
    async def apply_copyright_bypass(
        self,
        video_path: str,
        options: CopyrightOptions,
        work_dir: Path,
    ) -> str:
        """
        Apply copyright bypass filters.
        
        Filters:
        - color_adjust: brightness +6%, contrast +10%, saturation +10%
        - horizontal_flip: Mirror the video
        - slight_zoom: 5% zoom then crop
        
        Video Format:
        - Output codec: H.264 (libx264)
        - Preset: fast
        - CRF: 23
        """
        output_path = work_dir / "copyright_bypass.mp4"
        
        # Build filter chain
        filters = []
        
        # Color adjustment
        if options.color_adjust:
            filters.append("eq=brightness=0.06:contrast=1.1:saturation=1.1")
        
        # Horizontal flip
        if options.horizontal_flip:
            filters.append("hflip")
        
        # Slight zoom (5%)
        if options.slight_zoom:
            filters.append("scale=iw*1.05:ih*1.05,crop=iw/1.05:ih/1.05")
        
        if not filters:
            return video_path
        
        filter_str = ",".join(filters)
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
