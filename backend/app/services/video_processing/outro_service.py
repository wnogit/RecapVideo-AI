"""
Video Processing - Outro Service
Outro video generation and concatenation
"""
from pathlib import Path
from typing import Optional

from loguru import logger

from .models import OutroOptions
from .ffmpeg_utils import FFmpegUtils


class OutroService:
    """
    Service for outro generation.
    Creates platform-specific outro clips and concatenates with main video.
    
    Video Format Info:
    - Generated video: 1080p
    - Duration: configurable (default 5s)
    - Supports: YouTube, TikTok, Facebook, Instagram
    """
    
    def __init__(self, ffmpeg_utils: FFmpegUtils, font_path: Optional[str] = None):
        self.ffmpeg = ffmpeg_utils
        self.font_path = font_path or "DejaVuSans"
    
    async def generate_outro(
        self,
        options: OutroOptions,
        work_dir: Path,
    ) -> str:
        """
        Generate outro video clip.
        
        Video Format:
        - Resolution: 1080x1920 (9:16)
        - Duration: options.duration seconds
        - Background: Gradient or solid color
        """
        output_path = work_dir / "outro.mp4"
        
        # Platform-specific colors and text
        platform_styles = {
            "youtube": {"color": "#FF0000", "text": "Subscribe for more!"},
            "tiktok": {"color": "#00F2EA", "text": "Follow for more!"},
            "facebook": {"color": "#1877F2", "text": "Like & Follow!"},
            "instagram": {"color": "#833AB4", "text": "Follow for more!"},
        }
        style = platform_styles.get(options.platform, platform_styles["youtube"])
        
        # Channel name display
        channel_text = options.channel_name if options.channel_name else "RecapVideo.AI"
        
        # Build FFmpeg command for generating outro
        # Create a black background with text
        filter_str = (
            f"color=c=black:s=1080x1920:d={options.duration},"
            f"drawtext=text='{channel_text}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50:fontfile={self.font_path},"
            f"drawtext=text='{style['text']}':fontsize=40:fontcolor={style['color']}:x=(w-text_w)/2:y=(h-text_h)/2+30:fontfile={self.font_path}"
        )
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-f", "lavfi",
            "-i", f"color=c=black:s=1080x1920:d={options.duration}",
            "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=stereo",
            "-t", str(options.duration),
            "-vf", f"drawtext=text='{channel_text}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='{style['text']}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+50",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "fast",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
    
    async def concat_videos(
        self,
        video1_path: str,
        video2_path: str,
        work_dir: Path,
    ) -> str:
        """
        Concatenate two videos.
        
        Video Format:
        - Uses concat filter for seamless joining
        - Re-encodes for consistent format
        """
        output_path = work_dir / "concatenated.mp4"
        
        # Create concat file
        concat_file = work_dir / "concat.txt"
        with open(concat_file, "w") as f:
            f.write(f"file '{video1_path}'\n")
            f.write(f"file '{video2_path}'\n")
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "fast",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
