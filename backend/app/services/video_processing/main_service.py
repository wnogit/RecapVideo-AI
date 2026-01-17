"""
Video Processing - Main Service (Orchestrator)
Coordinates all video processing services in correct order

OPTIMIZED V2: Single-Pass FFmpeg processing for 3-5x speed improvement
- Feature flag: USE_SINGLE_PASS (default: True)
- Falls back to multi-pass if single-pass fails
"""
import os
from pathlib import Path
from typing import Optional, Callable, List
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
from .single_pass_processor import SinglePassProcessorV2

# Feature flag for single-pass processing
USE_SINGLE_PASS = os.environ.get("USE_SINGLE_PASS", "true").lower() == "true"


class VideoProcessingService:
    """
    Main orchestrator for video processing.
    Coordinates all services in the correct processing order.
    
    Processing Order (OPTIMIZED):
    Phase 1: Visual Effects (Single FFmpeg command)
        1. Copyright bypass (color, flip, zoom)
        2. Blur regions
        3. Custom crop OR resize to aspect ratio
        4. Logo overlay
    Phase 2: Audio + Subtitles
        5. Replace audio with TTS
        6. Burn subtitles
    Phase 3: Outro
        7. Add outro
    """
    
    # Aspect ratio dimensions (1080p)
    ASPECT_RATIOS = {
        "9:16": (1080, 1920),   # TikTok, Shorts
        "16:9": (1920, 1080),   # YouTube
        "1:1": (1080, 1080),    # Instagram Square
        "4:5": (1080, 1350),    # Instagram Portrait
    }
    
    # Logo sizes in pixels
    LOGO_SIZES = {
        "small": 60,
        "medium": 80,
        "large": 120,
    }
    
    def __init__(
        self,
        ffmpeg_path: str = "ffmpeg",
        ffprobe_path: str = "ffprobe",
        font_path: Optional[str] = None,
    ):
        self.ffmpeg_utils = FFmpegUtils(ffmpeg_path, ffprobe_path)
        self.font_path = font_path
        
        # Initialize all services (for fallback and specific operations)
        self.blur_service = BlurService(self.ffmpeg_utils)
        self.copyright_service = CopyrightService(self.ffmpeg_utils)
        self.resize_service = ResizeService(self.ffmpeg_utils)
        self.logo_service = LogoService(self.ffmpeg_utils)
        self.audio_service = AudioService(self.ffmpeg_utils)
        self.subtitle_service = SubtitleService(self.ffmpeg_utils, font_path)
        self.outro_service = OutroService(self.ffmpeg_utils, font_path)
        
        # Initialize single-pass processor
        self.single_pass = SinglePassProcessorV2(
            self.ffmpeg_utils,
            self.subtitle_service,
            self.outro_service,
        )
    
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
        
        OPTIMIZED V2: Uses single-pass FFmpeg processing by default.
        Falls back to multi-pass if single-pass fails.
        
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
        
        try:
            # ============================================
            # TRY SINGLE-PASS PROCESSING (3-5x FASTER)
            # ============================================
            if USE_SINGLE_PASS:
                try:
                    self._update_progress(progress_callback, "Starting optimized processing", 5)
                    logger.info("[PROCESS] Using SINGLE-PASS optimized processing")
                    
                    # Prepare logo path
                    logo_path = None
                    if options.logo.enabled and options.logo.image_path:
                        logo_path = await self.logo_service._ensure_local_logo(
                            options.logo.image_path, work_dir
                        )
                    
                    self._update_progress(progress_callback, "Processing video (single-pass)", 20)
                    
                    result = await self.single_pass.process(
                        source_video=source_video,
                        output_path=output_path,
                        options=options,
                        audio_path=audio_path,
                        subtitle_path=subtitle_path,
                        logo_path=logo_path,
                        work_dir=work_dir,
                    )
                    
                    self._update_progress(progress_callback, "Complete", 100)
                    logger.info(f"[PROCESS] Single-pass complete! Output: {output_path}")
                    return result
                    
                except Exception as single_pass_error:
                    logger.warning(f"[PROCESS] Single-pass failed, falling back to multi-pass: {single_pass_error}")
                    # Continue to multi-pass below
            
            # ============================================
            # FALLBACK: MULTI-PASS PROCESSING
            # ============================================
            logger.info("[PROCESS] Using multi-pass processing")
            return await self._process_multi_pass(
                source_video=source_video,
                output_path=output_path,
                options=options,
                audio_path=audio_path,
                subtitle_path=subtitle_path,
                progress_callback=progress_callback,
                work_dir=work_dir,
            )
            
        except Exception as e:
            logger.error(f"[PROCESS] Failed: {e}")
            raise
        finally:
            # Cleanup work directory
            try:
                shutil.rmtree(work_dir)
            except Exception as cleanup_err:
                logger.warning(f"Failed to cleanup work directory {work_dir}: {cleanup_err}")
    
    async def _process_multi_pass(
        self,
        source_video: str,
        output_path: str,
        options: VideoProcessingOptions,
        audio_path: Optional[str],
        subtitle_path: Optional[str],
        progress_callback: Optional[Callable[[str, int], None]],
        work_dir: Path,
    ) -> str:
        """
        Original multi-pass processing (fallback).
        """
        current_video = source_video
        # ============================================
        # PHASE 1: Visual Effects (OPTIMIZED - Single FFmpeg command)
        # Steps 1-4: Copyright, Blur, Resize, Logo
        # ============================================
        self._update_progress(progress_callback, "Processing visual effects", 10)
        logger.info("[MULTI-PASS] Phase 1: Visual effects (optimized single command)")
        
        current_video = await self._process_visual_effects_combined(
            current_video, options, work_dir
        )
        self._update_progress(progress_callback, "Visual effects complete", 40)
        
        # ============================================
        # PHASE 2: Audio + Subtitles
        # ============================================
        
        # Step 5: Replace audio with TTS
        if audio_path:
            self._update_progress(progress_callback, "Replacing audio", 50)
            logger.info("[MULTI-PASS] Step 5: Replace audio")
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
            logger.info("[MULTI-PASS] Step 6: Burn subtitles")
            current_video = await self.subtitle_service.burn_subtitles(
                current_video, subtitle_path, options.subtitles, work_dir
            )
        
        # ============================================
        # PHASE 3: Outro
        # ============================================
        
        # Step 7: Generate and add outro
        if options.outro.enabled:
            self._update_progress(progress_callback, "Adding outro", 85)
            logger.info("[MULTI-PASS] Step 7: Generate outro")
            outro_video = await self.outro_service.generate_outro(
                options.outro, work_dir
            )
            current_video = await self.outro_service.concat_videos(
                current_video, outro_video, work_dir
            )
        
        # Copy final output
        self._update_progress(progress_callback, "Finalizing", 95)
        shutil.copy2(current_video, output_path)
        
        logger.info(f"[MULTI-PASS] Complete! Output: {output_path}")
        self._update_progress(progress_callback, "Complete", 100)
        
        return output_path
    
    async def _process_visual_effects_combined(
        self,
        video_path: str,
        options: VideoProcessingOptions,
        work_dir: Path,
    ) -> str:
        """
        OPTIMIZED: Process Steps 1-4 in a single FFmpeg command.
        
        Combines:
        - Step 1: Copyright bypass (color, flip, zoom)
        - Step 2: Blur regions
        - Step 3: Resize/crop
        - Step 4: Logo overlay
        
        This reduces disk I/O by avoiding intermediate files.
        Processing speed improvement: ~40-60%
        """
        output_path = work_dir / "visual_effects.mp4"
        
        # Get video dimensions for calculations
        video_width, video_height = await self.ffmpeg_utils.get_video_dimensions(video_path)
        logger.info(f"Source video: {video_width}x{video_height}")
        
        # Build the filter chain
        filters: List[str] = []
        inputs: List[str] = ["-i", video_path]
        
        # ========== Step 1: Copyright bypass filters ==========
        copyright_filters = self._build_copyright_filters(options.copyright)
        if copyright_filters:
            filters.extend(copyright_filters)
            logger.info(f"[OPTIMIZE] Copyright filters: {len(copyright_filters)}")
        
        # ========== Step 2: Blur regions (complex) ==========
        # Note: Blur requires filter_complex, handle separately if enabled
        has_blur = options.blur.enabled and options.blur.regions
        
        # ========== Step 3: Resize/Crop filters ==========
        resize_filter = self._build_resize_filter(options, video_width, video_height)
        if resize_filter:
            filters.append(resize_filter)
            logger.info(f"[OPTIMIZE] Resize filter: {options.aspect_ratio}")
        
        # ========== Step 4: Logo overlay ==========
        logo_path = None
        if options.logo.enabled and options.logo.image_path:
            logo_path = await self.logo_service._ensure_local_logo(
                options.logo.image_path, work_dir
            )
        
        # Build FFmpeg command based on what's needed
        if has_blur or logo_path:
            # Use filter_complex for blur and/or logo
            return await self._run_complex_visual_pipeline(
                video_path, output_path, options, filters, 
                logo_path, video_width, video_height, work_dir
            )
        elif filters:
            # Simple filter chain (no blur, no logo)
            return await self._run_simple_visual_pipeline(
                video_path, output_path, filters
            )
        else:
            # No visual effects needed
            logger.info("[OPTIMIZE] No visual effects, skipping phase 1")
            return video_path
    
    def _build_copyright_filters(self, options: CopyrightOptions) -> List[str]:
        """Build copyright bypass filter strings."""
        filters = []
        
        if options.color_adjust:
            filters.append("eq=brightness=0.06:contrast=1.1:saturation=1.1")
        
        if options.horizontal_flip:
            filters.append("hflip")
        
        if options.slight_zoom:
            filters.append("scale=iw*1.05:ih*1.05,crop=iw/1.05:ih/1.05")
        
        return filters
    
    def _build_resize_filter(
        self, 
        options: VideoProcessingOptions,
        src_width: int,
        src_height: int
    ) -> Optional[str]:
        """Build resize/crop filter string."""
        if options.aspect_ratio == "custom" and options.crop.enabled:
            # Custom crop
            crop_x = int(src_width * options.crop.x / 100)
            crop_y = int(src_height * options.crop.y / 100)
            crop_w = int(src_width * options.crop.width / 100)
            crop_h = int(src_height * options.crop.height / 100)
            
            crop_w = max(crop_w, 100)
            crop_h = max(crop_h, 100)
            crop_x = min(crop_x, src_width - crop_w)
            crop_y = min(crop_y, src_height - crop_h)
            
            # Ensure even dimensions
            crop_w = crop_w - (crop_w % 2)
            crop_h = crop_h - (crop_h % 2)
            
            return f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y}"
        
        elif options.aspect_ratio in self.ASPECT_RATIOS:
            # Standard aspect ratio resize
            width, height = self.ASPECT_RATIOS[options.aspect_ratio]
            return f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        
        return None
    
    async def _run_simple_visual_pipeline(
        self,
        input_path: str,
        output_path: Path,
        filters: List[str],
    ) -> str:
        """Run simple filter chain (no complex filtering needed)."""
        filter_str = ",".join(filters)
        
        cmd = [
            self.ffmpeg_utils.ffmpeg_path, "-y",
            "-i", input_path,
            "-vf", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "23",
            str(output_path)
        ]
        
        logger.info(f"[OPTIMIZE] Running simple pipeline: {len(filters)} filters")
        await self.ffmpeg_utils.run_ffmpeg(cmd)
        return str(output_path)
    
    async def _run_complex_visual_pipeline(
        self,
        input_path: str,
        output_path: Path,
        options: VideoProcessingOptions,
        base_filters: List[str],
        logo_path: Optional[str],
        video_width: int,
        video_height: int,
        work_dir: Path,
    ) -> str:
        """
        Run complex filter pipeline with blur and/or logo.
        Uses filter_complex for multi-input/output operations.
        """
        # Calculate target dimensions for blur calculations
        if options.aspect_ratio in self.ASPECT_RATIOS:
            target_width, target_height = self.ASPECT_RATIOS[options.aspect_ratio]
        else:
            target_width, target_height = video_width, video_height
        
        # Build filter_complex string
        filter_parts = []
        current_label = "0:v"
        label_counter = 0
        
        # Apply base filters (copyright) first
        if base_filters:
            base_filter_str = ",".join(base_filters)
            filter_parts.append(f"[{current_label}]{base_filter_str}[v{label_counter}]")
            current_label = f"v{label_counter}"
            label_counter += 1
        
        # Apply blur regions
        if options.blur.enabled and options.blur.regions:
            blur_result = self._build_blur_filter_complex(
                options.blur, current_label, label_counter, 
                video_width, video_height
            )
            filter_parts.extend(blur_result["filters"])
            current_label = blur_result["output_label"]
            label_counter = blur_result["label_counter"]
        
        # Apply resize
        resize_filter = self._build_resize_filter(options, video_width, video_height)
        if resize_filter:
            filter_parts.append(f"[{current_label}]{resize_filter}[v{label_counter}]")
            current_label = f"v{label_counter}"
            label_counter += 1
        
        # Apply logo overlay
        inputs = ["-i", input_path]
        if logo_path:
            inputs.extend(["-i", logo_path])
            logo_size = self.LOGO_SIZES.get(options.logo.size, 80)
            opacity = options.logo.opacity / 100
            
            positions = {
                "top-left": "x=20:y=20",
                "top-right": "x=main_w-overlay_w-20:y=20",
                "bottom-left": "x=20:y=main_h-overlay_h-20",
                "bottom-right": "x=main_w-overlay_w-20:y=main_h-overlay_h-20",
            }
            pos = positions.get(options.logo.position, positions["top-right"])
            
            filter_parts.append(
                f"[1:v]scale={logo_size}:-1,format=rgba,colorchannelmixer=aa={opacity}[logo]"
            )
            filter_parts.append(f"[{current_label}][logo]overlay={pos}[vout]")
            current_label = "vout"
        
        # Build final filter_complex string
        if filter_parts:
            # Remove last label assignment if it's the final output
            last_filter = filter_parts[-1]
            if f"[{current_label}]" in last_filter and current_label != "vout":
                filter_parts[-1] = last_filter.rsplit("[", 1)[0]
            
            filter_complex = ";".join(filter_parts)
            
            cmd = [
                self.ffmpeg_utils.ffmpeg_path, "-y",
                *inputs,
                "-filter_complex", filter_complex,
                "-map", f"[{current_label}]" if logo_path else f"[{current_label}]",
                "-map", "0:a?",
                "-c:a", "copy",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "23",
                str(output_path)
            ]
            
            # Fix: if no explicit output label, remove the map for it
            if current_label not in ["vout"] and not logo_path:
                cmd = [
                    self.ffmpeg_utils.ffmpeg_path, "-y",
                    *inputs,
                    "-filter_complex", filter_complex.rstrip(f"[{current_label}]"),
                    "-c:a", "copy",
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-crf", "23",
                    str(output_path)
                ]
            
            logger.info(f"[OPTIMIZE] Running complex pipeline: {len(filter_parts)} filter stages")
            await self.ffmpeg_utils.run_ffmpeg(cmd)
            return str(output_path)
        
        return input_path
    
    def _build_blur_filter_complex(
        self,
        blur_options: BlurOptions,
        input_label: str,
        label_counter: int,
        video_width: int,
        video_height: int,
    ) -> dict:
        """Build blur filter_complex parts."""
        filters = []
        current_label = input_label
        
        for i, region in enumerate(blur_options.regions):
            x = int((region.x / 100) * video_width)
            y = int((region.y / 100) * video_height)
            w = int((region.width / 100) * video_width)
            h = int((region.height / 100) * video_height)
            
            w = max(w, 10)
            h = max(h, 10)
            x = min(x, video_width - w)
            y = min(y, video_height - h)
            
            if blur_options.blur_type == "gaussian":
                sigma = blur_options.intensity / 2
                blur_filter = f"gblur=sigma={sigma}"
            else:
                radius = blur_options.intensity
                blur_filter = f"boxblur={radius}:{radius}:1"
            
            # Crop region, blur it
            filters.append(
                f"[{current_label}]crop={w}:{h}:{x}:{y},{blur_filter}[blur{i}]"
            )
            
            # Overlay blurred region back
            new_label = f"v{label_counter}"
            filters.append(
                f"[{current_label}][blur{i}]overlay={x}:{y}[{new_label}]"
            )
            current_label = new_label
            label_counter += 1
        
        return {
            "filters": filters,
            "output_label": current_label,
            "label_counter": label_counter,
        }
    
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
