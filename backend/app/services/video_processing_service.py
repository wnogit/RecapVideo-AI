"""
Video Processing Service
Handles all FFmpeg operations for video generation
- Copyright bypass (color adjust, flip, zoom, pitch)
- Subtitle burning
- Logo overlay
- Outro generation
- Final rendering
"""
import asyncio
import json
import os
import shutil
import subprocess
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import webvtt
from loguru import logger

from app.core.config import settings


@dataclass
class CopyrightOptions:
    """Copyright bypass options."""
    color_adjust: bool = True
    horizontal_flip: bool = True
    slight_zoom: bool = False
    audio_pitch_shift: bool = True


@dataclass
class SubtitleOptions:
    """Subtitle options."""
    enabled: bool = True
    size: str = "large"  # small, medium, large
    position: str = "bottom"  # top, center, bottom
    background: str = "semi"  # none, semi, solid
    color: str = "#FFFFFF"
    word_highlight: bool = True


@dataclass
class LogoOptions:
    """Logo overlay options."""
    enabled: bool = False
    image_path: Optional[str] = None
    position: str = "top-right"  # top-left, top-right, bottom-left, bottom-right
    size: str = "medium"  # small, medium, large
    opacity: int = 70  # 0-100


@dataclass
class OutroOptions:
    """Outro options."""
    enabled: bool = False
    platform: str = "youtube"  # youtube, tiktok, facebook, instagram
    channel_name: str = ""
    logo_path: Optional[str] = None
    duration: int = 5  # seconds


@dataclass
class VideoProcessingOptions:
    """All video processing options."""
    aspect_ratio: str = "9:16"  # 9:16, 16:9, 1:1, 4:5
    copyright: CopyrightOptions = field(default_factory=CopyrightOptions)
    subtitles: SubtitleOptions = field(default_factory=SubtitleOptions)
    logo: LogoOptions = field(default_factory=LogoOptions)
    outro: OutroOptions = field(default_factory=OutroOptions)


class VideoProcessingService:
    """Service for processing videos with FFmpeg."""
    
    # Aspect ratio dimensions (1080p)
    ASPECT_RATIOS = {
        "9:16": (1080, 1920),   # TikTok, Shorts
        "16:9": (1920, 1080),   # YouTube
        "1:1": (1080, 1080),    # Instagram Square
        "4:5": (1080, 1350),    # Instagram Portrait
    }
    
    # Font sizes
    FONT_SIZES = {
        "small": 28,
        "medium": 36,
        "large": 48,
    }
    
    # Logo sizes
    LOGO_SIZES = {
        "small": 60,
        "medium": 80,
        "large": 120,
    }
    
    # Cross-platform font paths (fallback order)
    # Priority: Bundled fonts > System fonts
    FONT_PATHS = [
        # Bundled fonts in project (best for Docker)
        str(Path(__file__).parent.parent / "assets" / "fonts" / "NotoSansMyanmar-Regular.ttf"),
        str(Path(__file__).parent.parent / "assets" / "fonts" / "Pyidaungsu-Regular.ttf"),
        str(Path(__file__).parent.parent / "assets" / "fonts" / "DejaVuSans.ttf"),
        # Linux system fonts
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Debian/Ubuntu
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",           # Alpine/RHEL
        "/usr/share/fonts/TTF/DejaVuSans.ttf",              # Arch Linux
        "/usr/share/fonts/noto/NotoSansMyanmar-Regular.ttf", # Noto Myanmar
        # Windows fonts
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/seguiemj.ttf",  # Segoe UI Emoji
        # macOS fonts
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    
    def __init__(self):
        """Initialize video processing service."""
        self.temp_dir = Path(settings.TEMP_FILES_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.ffmpeg_path = "ffmpeg"  # Assumes ffmpeg is in PATH
        self.ffprobe_path = "ffprobe"
        self.font_path = self._find_font()
        
    async def process_video(
        self,
        source_video_path: str,
        audio_path: str,
        subtitle_path: Optional[str],
        options: VideoProcessingOptions,
        progress_callback: Optional[Callable] = None,
    ) -> str:
        """
        Process video with all options applied.
        
        Args:
            source_video_path: Path to source video file
            audio_path: Path to TTS audio file
            subtitle_path: Path to subtitle file (VTT/SRT)
            options: Processing options
            progress_callback: Callback for progress updates
            
        Returns:
            Path to processed video file
        """
        work_dir = self.temp_dir / str(uuid.uuid4())
        work_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            current_video = source_video_path
            
            # Step 1: Apply copyright protection (if enabled)
            if progress_callback:
                await progress_callback(10, "Applying protection...")
            
            if any([
                options.copyright.color_adjust,
                options.copyright.horizontal_flip,
                options.copyright.slight_zoom,
            ]):
                current_video = await self._apply_copyright_bypass(
                    current_video, options.copyright, work_dir
                )
            
            # Step 2: Resize to target aspect ratio
            if progress_callback:
                await progress_callback(25, "Resizing video...")
            
            current_video = await self._resize_video(
                current_video, options.aspect_ratio, work_dir
            )
            
            # Step 3: Add logo overlay (if enabled)
            if options.logo.enabled and options.logo.image_path:
                if progress_callback:
                    await progress_callback(40, "Adding logo...")
                
                current_video = await self._add_logo(
                    current_video, options.logo, work_dir
                )
            
            # Step 4: Replace audio with TTS
            if progress_callback:
                await progress_callback(55, "Adding voiceover...")
            
            current_video = await self._replace_audio(
                current_video, audio_path, options.copyright.audio_pitch_shift, work_dir
            )
            
            # Step 5: Burn subtitles (if enabled)
            if options.subtitles.enabled and subtitle_path:
                if progress_callback:
                    await progress_callback(70, "Adding subtitles...")
                
                current_video = await self._burn_subtitles(
                    current_video, subtitle_path, options.subtitles, work_dir
                )
            
            # Step 6: Add outro (if enabled)
            if options.outro.enabled:
                if progress_callback:
                    await progress_callback(85, "Adding outro...")
                
                outro_video = await self._generate_outro(options.outro, work_dir)
                current_video = await self._concat_videos(
                    current_video, outro_video, work_dir
                )
            
            # Step 7: Final encoding
            if progress_callback:
                await progress_callback(95, "Final encoding...")
            
            output_path = work_dir / "final_output.mp4"
            await self._final_encode(current_video, str(output_path))
            
            if progress_callback:
                await progress_callback(100, "Complete!")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            raise
    
    async def _apply_copyright_bypass(
        self,
        video_path: str,
        options: CopyrightOptions,
        work_dir: Path,
    ) -> str:
        """Apply copyright bypass filters."""
        output_path = work_dir / "copyright_bypass.mp4"
        
        # Build filter chain
        filters = []
        
        # Color adjustment (brightness +6%, contrast +10%, saturation +10%)
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
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _resize_video(
        self,
        video_path: str,
        aspect_ratio: str,
        work_dir: Path,
    ) -> str:
        """Resize video to target aspect ratio."""
        output_path = work_dir / "resized.mp4"
        width, height = self.ASPECT_RATIOS.get(aspect_ratio, (1080, 1920))
        
        # Scale and pad to fit aspect ratio
        filter_str = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _add_logo(
        self,
        video_path: str,
        options: LogoOptions,
        work_dir: Path,
    ) -> str:
        """Add logo overlay to video."""
        output_path = work_dir / "with_logo.mp4"
        logo_size = self.LOGO_SIZES.get(options.size, 80)
        
        # Position mapping
        positions = {
            "top-left": f"x=20:y=20",
            "top-right": f"x=main_w-overlay_w-20:y=20",
            "bottom-left": f"x=20:y=main_h-overlay_h-20",
            "bottom-right": f"x=main_w-overlay_w-20:y=main_h-overlay_h-20",
        }
        pos = positions.get(options.position, positions["top-right"])
        
        # Opacity filter
        opacity = options.opacity / 100
        
        # Overlay filter
        filter_str = f"[1:v]scale={logo_size}:-1,format=rgba,colorchannelmixer=aa={opacity}[logo];[0:v][logo]overlay={pos}"
        
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-i", options.image_path,
            "-filter_complex", filter_str,
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _replace_audio(
        self,
        video_path: str,
        audio_path: str,
        pitch_shift: bool,
        work_dir: Path,
    ) -> str:
        """Replace video audio with TTS audio."""
        output_path = work_dir / "with_audio.mp4"
        
        # Get video duration
        video_duration = await self._get_duration(video_path)
        audio_duration = await self._get_duration(audio_path)
        
        # Build command
        if pitch_shift:
            # Apply pitch shift (+3%)
            audio_filter = "asetrate=44100*1.03,aresample=44100"
            cmd = [
                self.ffmpeg_path, "-y",
                "-i", video_path,
                "-i", audio_path,
                "-filter_complex", f"[1:a]{audio_filter}[a]",
                "-map", "0:v",
                "-map", "[a]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(output_path)
            ]
        else:
            cmd = [
                self.ffmpeg_path, "-y",
                "-i", video_path,
                "-i", audio_path,
                "-map", "0:v",
                "-map", "1:a",
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(output_path)
            ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _burn_subtitles(
        self,
        video_path: str,
        subtitle_path: str,
        options: SubtitleOptions,
        work_dir: Path,
    ) -> str:
        """Burn subtitles into video."""
        output_path = work_dir / "with_subs.mp4"
        font_size = self.FONT_SIZES.get(options.size, 36)
        
        # Convert subtitle to ASS for better styling
        ass_path = await self._convert_to_ass(
            subtitle_path, options, work_dir
        )
        
        # Escape path for FFmpeg (Windows compatibility)
        ass_path_escaped = str(ass_path).replace("\\", "/").replace(":", "\\\\:")
        
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", f"ass={ass_path_escaped}",
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _convert_to_ass(
        self,
        subtitle_path: str,
        options: SubtitleOptions,
        work_dir: Path,
    ) -> Path:
        """Convert VTT/SRT to ASS with styling."""
        ass_path = work_dir / "subtitles.ass"
        font_size = self.FONT_SIZES.get(options.size, 36)
        
        # Position mapping (MarginV)
        positions = {
            "top": 20,
            "center": 200,
            "bottom": 50,
        }
        margin_v = positions.get(options.position, 50)
        
        # Background style
        backgrounds = {
            "none": 0,
            "semi": 1,  # Opaque box
            "solid": 3,  # Full opaque
        }
        border_style = backgrounds.get(options.background, 1)
        
        # Color conversion (hex to ASS format BGR)
        color = options.color.lstrip("#")
        ass_color = f"&H00{color[4:6]}{color[2:4]}{color[0:2]}"
        
        # ASS header - use Arial for Unicode support
        ass_content = f"""[Script Info]
Title: Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,{font_size},{ass_color},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,{border_style},2,1,2,10,10,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Parse VTT using webvtt-py library (robust parsing)
        try:
            for caption in webvtt.read(subtitle_path):
                start = self._time_to_ass(caption.start)
                end = self._time_to_ass(caption.end)
                # Replace newlines with ASS line break
                text = caption.text.replace("\n", "\\N")
                ass_content += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
        except Exception as e:
            logger.warning(f"webvtt-py parsing failed, using fallback: {e}")
            # Fallback to manual parsing
            ass_content = self._parse_vtt_fallback(subtitle_path, ass_content)
        
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)
        
        return ass_path
    
    def _time_to_ass(self, time_str: str) -> str:
        """Convert VTT time (HH:MM:SS.mmm) to ASS time (H:MM:SS.cc)."""
        # VTT: 00:00:01.500 -> ASS: 0:00:01.50
        parts = time_str.replace(",", ".").split(":")
        if len(parts) == 2:
            parts.insert(0, "0")
        
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_ms = parts[2].split(".")
        seconds = int(seconds_ms[0])
        # Convert milliseconds to centiseconds (2 digits)
        ms = seconds_ms[1][:2] if len(seconds_ms) > 1 else "00"
        
        return f"{hours}:{minutes:02d}:{seconds:02d}.{ms}"
    
    def _parse_vtt_fallback(self, subtitle_path: str, ass_header: str) -> str:
        """Fallback VTT parser if webvtt-py fails."""
        with open(subtitle_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        lines = content.split("\n")
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if "-->" in line:
                # Time line
                times = line.split("-->")
                start = self._time_to_ass(times[0].strip())
                end = self._time_to_ass(times[1].strip().split()[0])
                
                # Get text
                i += 1
                text_lines = []
                while i < len(lines) and lines[i].strip():
                    text_lines.append(lines[i].strip())
                    i += 1
                text = "\\N".join(text_lines)
                
                ass_header += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
            i += 1
        
        return ass_header
    
    def _find_font(self) -> str:
        """Find available font for text rendering."""
        for font_path in self.FONT_PATHS:
            if Path(font_path).exists():
                logger.debug(f"Using font: {font_path}")
                return font_path
        # Fallback - let FFmpeg use default
        logger.warning("No font found, FFmpeg will use default")
        return ""
    
    async def _generate_outro(
        self,
        options: OutroOptions,
        work_dir: Path,
    ) -> str:
        """Generate outro video clip."""
        output_path = work_dir / "outro.mp4"
        width, height = 1080, 1920  # Default 9:16
        
        # Platform colors and text
        platform_config = {
            "youtube": {"color": "0xff0000", "text": "Subscribe လုပ်ပေးပါ", "icon": "🔔"},
            "tiktok": {"color": "0x000000", "text": "Follow လုပ်ပေးပါ", "icon": "🎵"},
            "facebook": {"color": "0x1877f2", "text": "Page ကို Like လုပ်ပေးပါ", "icon": "👍"},
            "instagram": {"color": "0xe1306c", "text": "Follow လုပ်ပေးပါ", "icon": "📷"},
        }
        
        config = platform_config.get(options.platform, platform_config["youtube"])
        
        # Build font option if available
        font_opt = f":fontfile={self.font_path}" if self.font_path else ""
        
        # Create outro using FFmpeg
        # Simple text overlay on colored background
        filter_complex = (
            f"color=c={config['color']}:s={width}x{height}:d={options.duration}[bg];"
            f"[bg]drawtext=text='{options.channel_name}':fontsize=48:fontcolor=white:"
            f"x=(w-text_w)/2:y=h/2-50{font_opt}[t1];"
            f"[t1]drawtext=text='{config['text']}':fontsize=36:fontcolor=white:"
            f"x=(w-text_w)/2:y=h/2+50{font_opt}"
        )
        
        cmd = [
            self.ffmpeg_path, "-y",
            "-f", "lavfi",
            "-i", f"color=c={config['color']}:s={width}x{height}:d={options.duration}",
            "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=stereo",
            "-t", str(options.duration),
            "-c:v", "libx264",
            "-preset", "fast",
            "-c:a", "aac",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _concat_videos(
        self,
        video1_path: str,
        video2_path: str,
        work_dir: Path,
    ) -> str:
        """Concatenate two videos."""
        output_path = work_dir / "concatenated.mp4"
        concat_file = work_dir / "concat.txt"
        
        # Create concat file
        with open(concat_file, "w") as f:
            f.write(f"file '{video1_path}'\n")
            f.write(f"file '{video2_path}'\n")
        
        cmd = [
            self.ffmpeg_path, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            str(output_path)
        ]
        
        await self._run_ffmpeg(cmd)
        return str(output_path)
    
    async def _final_encode(
        self,
        video_path: str,
        output_path: str,
    ) -> None:
        """Final encoding with optimized settings."""
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            output_path
        ]
        
        await self._run_ffmpeg(cmd)
    
    async def _get_duration(self, file_path: str) -> float:
        """Get media file duration in seconds."""
        cmd = [
            self.ffprobe_path,
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "json",
            file_path
        ]
        
        result = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await result.communicate()
        data = json.loads(stdout)
        return float(data["format"]["duration"])
    
    async def _run_ffmpeg(self, cmd: list) -> None:
        """Run FFmpeg command asynchronously."""
        logger.debug(f"Running FFmpeg: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown FFmpeg error"
            logger.error(f"FFmpeg failed: {error_msg}")
            raise RuntimeError(f"FFmpeg failed: {error_msg}")
        
        logger.debug("FFmpeg completed successfully")
    
    def cleanup_work_dir(self, work_dir: str) -> None:
        """Clean up temporary work directory."""
        try:
            shutil.rmtree(work_dir)
            logger.debug(f"Cleaned up work dir: {work_dir}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {work_dir}: {e}")


# Singleton instance
video_processing_service = VideoProcessingService()
