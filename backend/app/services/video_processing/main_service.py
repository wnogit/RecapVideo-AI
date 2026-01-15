"""
Video Processing - Main Service (Orchestrator)
Coordinates all video processing services in correct order
"""
from pathlib import Path
from typing import Optional, Callable
import shutil

from loguru import logger

from .models import (
    CopyrightOptions,
    SubtitleOptions,
    LogoOptions,
    OutroOptions,
    BlurOptions,
    CropOptions,
    VideoProcessingOptions,
)
from .ffmpeg_utils import FFmpegUtils
from .blur_service import BlurService
from .copyright_service import CopyrightService
from .resize_service import ResizeService
from .logo_service import LogoService
from .audio_service import AudioService
from .subtitle_service import SubtitleService
from .outro_service import OutroService


class VideoProcessingService:
    """
    Main orchestrator for video processing.
    Coordinates all services in the correct processing order.
    
    Processing Order:
    1. Copyright bypass (color, flip, zoom)
    2. Blur regions
    3. Custom crop OR resize to aspect ratio
    4. Logo overlay
    5. Replace audio with TTS
    6. Burn subtitles
    7. Add outro
    """
    
    def __init__(
        self,
        ffmpeg_path: str = "ffmpeg",
        ffprobe_path: str = "ffprobe",
        font_path: Optional[str] = None,
    ):
        self.ffmpeg_utils = FFmpegUtils(ffmpeg_path, ffprobe_path)
        self.font_path = font_path
        
        # Initialize all services
        self.blur_service = BlurService(self.ffmpeg_utils)
        self.copyright_service = CopyrightService(self.ffmpeg_utils)
        self.resize_service = ResizeService(self.ffmpeg_utils)
        self.logo_service = LogoService(self.ffmpeg_utils)
        self.audio_service = AudioService(self.ffmpeg_utils)
        self.subtitle_service = SubtitleService(self.ffmpeg_utils, font_path)
        self.outro_service = OutroService(self.ffmpeg_utils, font_path)
    
    async def process_video(
        self,
        source_video: str,
        output_path: str,
        options: VideoProcessingOptions,
        audio_path: Optional[str] = None,
        subtitle_path: Optional[str] = None,
        progress_callback: Optional[Callable[[str, int], None]] = None,
    ) -> str:
        """
        Process video with all configured options.
        
        Args:
            source_video: Path to source video file
            output_path: Path for final output video
            options: VideoProcessingOptions with all settings
            audio_path: Optional TTS audio file path
            subtitle_path: Optional subtitle file path (VTT/SRT)
            progress_callback: Optional callback for progress updates
        
        Returns:
            Path to processed video file
        """
        work_dir = Path(output_path).parent / "work"
        work_dir.mkdir(parents=True, exist_ok=True)
        
        current_video = source_video
        
        try:
            # Step 1: Copyright bypass
            if self._has_copyright_effects(options.copyright):
                self._update_progress(progress_callback, "Applying copyright bypass", 10)
                logger.info("[PROCESS] Step 1: Copyright bypass")
                current_video = await self.copyright_service.apply_copyright_bypass(
                    current_video, options.copyright, work_dir
                )
            
            # Step 2: Blur regions
            if options.blur.enabled and options.blur.regions:
                self._update_progress(progress_callback, "Applying blur regions", 20)
                logger.info("[PROCESS] Step 2: Blur regions")
                current_video = await self.blur_service.apply_blur(
                    current_video, options.blur, work_dir
                )
            
            # Step 3: Resize or Custom Crop
            self._update_progress(progress_callback, "Resizing video", 30)
            if options.aspect_ratio == "custom" and options.crop.enabled:
                logger.info("[PROCESS] Step 3: Custom crop")
                current_video = await self.resize_service.apply_custom_crop(
                    current_video, options.crop, work_dir
                )
            elif options.aspect_ratio != "custom":
                logger.info(f"[PROCESS] Step 3: Resize to {options.aspect_ratio}")
                current_video = await self.resize_service.resize_video(
                    current_video, options.aspect_ratio, work_dir
                )
            
            # Step 4: Logo overlay
            if options.logo.enabled and options.logo.image_path:
                self._update_progress(progress_callback, "Adding logo", 40)
                logger.info("[PROCESS] Step 4: Logo overlay")
                current_video = await self.logo_service.add_logo(
                    current_video, options.logo, work_dir
                )
            
            # Step 5: Replace audio with TTS
            if audio_path:
                self._update_progress(progress_callback, "Replacing audio", 50)
                logger.info("[PROCESS] Step 5: Replace audio")
                current_video = await self.audio_service.replace_audio(
                    current_video,
                    audio_path,
                    options.copyright.audio_pitch_shift,
                    options.copyright.pitch_value,
                    work_dir
                )
            
            # Step 6: Burn subtitles
            if subtitle_path and options.subtitles.enabled:
                self._update_progress(progress_callback, "Burning subtitles", 70)
                logger.info("[PROCESS] Step 6: Burn subtitles")
                current_video = await self.subtitle_service.burn_subtitles(
                    current_video, subtitle_path, options.subtitles, work_dir
                )
            
            # Step 7: Generate and add outro
            if options.outro.enabled:
                self._update_progress(progress_callback, "Adding outro", 85)
                logger.info("[PROCESS] Step 7: Generate outro")
                outro_video = await self.outro_service.generate_outro(
                    options.outro, work_dir
                )
                current_video = await self.outro_service.concat_videos(
                    current_video, outro_video, work_dir
                )
            
            # Copy final output
            self._update_progress(progress_callback, "Finalizing", 95)
            shutil.copy2(current_video, output_path)
            
            logger.info(f"[PROCESS] Complete! Output: {output_path}")
            self._update_progress(progress_callback, "Complete", 100)
            
            return output_path
            
        except Exception as e:
            logger.error(f"[PROCESS] Failed: {e}")
            raise
        finally:
            # Cleanup work directory
            try:
                shutil.rmtree(work_dir)
            except Exception:
                pass
    
    def _has_copyright_effects(self, options: CopyrightOptions) -> bool:
        """Check if any copyright effects are enabled."""
        return options.color_adjust or options.horizontal_flip or options.slight_zoom
    
    def _update_progress(
        self,
        callback: Optional[Callable[[str, int], None]],
        status: str,
        percent: int
    ) -> None:
        """Update progress if callback is provided."""
        if callback:
            try:
                callback(status, percent)
            except Exception:
                pass
