"""
Video Processing - Resize Service
Video resizing and custom cropping
"""
from pathlib import Path
from loguru import logger

from .models import CropOptions
from .ffmpeg_utils import FFmpegUtils


class ResizeService:
    """
    Service for video resizing and custom cropping.
    
    Video Format Info:
    - Output: MP4 (H.264, CRF 23)
    - Supports standard aspect ratios and custom crop
    """
    
    # Aspect ratio dimensions (1080p)
    ASPECT_RATIOS = {
        "9:16": (1080, 1920),   # TikTok, Shorts
        "16:9": (1920, 1080),   # YouTube
        "1:1": (1080, 1080),    # Instagram Square
        "4:5": (1080, 1350),    # Instagram Portrait
    }
    
    def __init__(self, ffmpeg_utils: FFmpegUtils):
        self.ffmpeg = ffmpeg_utils
    
    async def resize_video(
        self,
        video_path: str,
        aspect_ratio: str,
        work_dir: Path,
    ) -> str:
        """
        Resize video to target aspect ratio with letterboxing.
        
        Video Format:
        - Uses scale and pad filters
        - Output codec: H.264 (libx264)
        """
        output_path = work_dir / "resized.mp4"
        width, height = self.ASPECT_RATIOS.get(aspect_ratio, (1080, 1920))
        
        logger.info(f"[RESIZE] Resizing to {aspect_ratio} ({width}x{height})")
        
        # Scale and pad to fit aspect ratio
        filter_str = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        
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
    
    async def apply_custom_crop(
        self,
        video_path: str,
        crop_options: CropOptions,
        work_dir: Path,
    ) -> str:
        """
        Apply custom crop to video based on percentage-based region.
        
        Video Format:
        - Crops to specified region
        - Scales to reasonable output size (max 1080p width)
        - Output codec: H.264 (libx264)
        """
        if not crop_options.enabled:
            return video_path
        
        output_path = work_dir / "cropped.mp4"
        
        # Get source video dimensions
        src_width, src_height = await self.ffmpeg.get_video_dimensions(video_path)
        
        # Convert percentage to pixels
        crop_x = int(src_width * crop_options.x / 100)
        crop_y = int(src_height * crop_options.y / 100)
        crop_w = int(src_width * crop_options.width / 100)
        crop_h = int(src_height * crop_options.height / 100)
        
        # Ensure minimum size
        crop_w = max(crop_w, 100)
        crop_h = max(crop_h, 100)
        
        # Ensure within bounds
        crop_x = min(crop_x, src_width - crop_w)
        crop_y = min(crop_y, src_height - crop_h)
        
        logger.info(f"[CROP] Cropping region: x={crop_x}, y={crop_y}, w={crop_w}, h={crop_h}")
        
        # Determine output size - scale to max 1080 width while maintaining aspect ratio
        if crop_w > 1080:
            scale_factor = 1080 / crop_w
            out_w = 1080
            out_h = int(crop_h * scale_factor)
            # Ensure even dimensions for video codec
            out_h = out_h - (out_h % 2)
            scale_filter = f",scale={out_w}:{out_h}"
        else:
            # Ensure even dimensions
            out_w = crop_w - (crop_w % 2)
            out_h = crop_h - (crop_h % 2)
            scale_filter = f",scale={out_w}:{out_h}" if crop_w != out_w or crop_h != out_h else ""
        
        # FFmpeg crop filter: crop=w:h:x:y
        filter_str = f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y}{scale_filter}"
        
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
