"""
Video Processing - Blur Service
Apply blur effects to video regions
"""
from pathlib import Path
from loguru import logger

from .models import BlurOptions
from .ffmpeg_utils import FFmpegUtils


class BlurService:
    """
    Service for applying blur effects to video regions.
    Used to mask watermarks, logos, or sensitive content.
    """
    
    def __init__(self, ffmpeg_utils: FFmpegUtils):
        self.ffmpeg = ffmpeg_utils
    
    async def apply_blur(
        self,
        video_path: str,
        options: BlurOptions,
        work_dir: Path,
    ) -> str:
        """
        Apply blur effect to specific regions of video.
        
        Video Format Info:
        - Input: Any FFmpeg-supported format
        - Output: MP4 (H.264, CRF 23)
        - Uses filter_complex for multi-region processing
        
        Args:
            video_path: Input video file path
            options: BlurOptions with regions, intensity, blur_type
            work_dir: Temporary working directory
            
        Returns:
            Path to blurred video file
        """
        if not options.regions:
            logger.info("No blur regions specified, skipping blur")
            return video_path
            
        output_path = work_dir / "blurred.mp4"
        
        # Get video dimensions
        video_width, video_height = await self.ffmpeg.get_video_dimensions(video_path)
        logger.info(f"Video dimensions: {video_width}x{video_height}")
        
        # Build complex filter for multiple blur regions
        filter_parts = []
        overlay_chain = "[0:v]"
        
        for i, region in enumerate(options.regions):
            # Convert percentage to pixels
            x = int((region.x / 100) * video_width)
            y = int((region.y / 100) * video_height)
            w = int((region.width / 100) * video_width)
            h = int((region.height / 100) * video_height)
            
            # Ensure minimum size
            w = max(w, 10)
            h = max(h, 10)
            
            # Ensure within bounds
            x = min(x, video_width - w)
            y = min(y, video_height - h)
            
            # Build blur filter for this region
            if options.blur_type == "gaussian":
                sigma = options.intensity / 2
                blur_filter = f"gblur=sigma={sigma}"
            else:
                radius = options.intensity
                blur_filter = f"boxblur={radius}:{radius}:1"
            
            # Crop region, blur it, then overlay
            filter_parts.append(
                f"[0:v]crop={w}:{h}:{x}:{y},{blur_filter}[blur{i}]"
            )
            
            if i == 0:
                overlay_chain = f"[0:v][blur{i}]overlay={x}:{y}[tmp{i}]"
            else:
                overlay_chain = f"[tmp{i-1}][blur{i}]overlay={x}:{y}[tmp{i}]"
        
        # Combine all filters
        filter_complex = ";".join(filter_parts) + ";" + overlay_chain
        
        # Replace last [tmpN] with output
        last_idx = len(options.regions) - 1
        filter_complex = filter_complex.replace(f"[tmp{last_idx}]", "")
        
        logger.info(f"Applying blur to {len(options.regions)} region(s): intensity={options.intensity}")
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-i", video_path,
            "-filter_complex", filter_complex,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
