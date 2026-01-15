"""
Video Processing - Subtitle Service
Subtitle conversion and burning
"""
from pathlib import Path
from typing import Optional

import webvtt
from loguru import logger

from .models import SubtitleOptions
from .ffmpeg_utils import FFmpegUtils


class SubtitleService:
    """
    Service for subtitle processing.
    Converts VTT/SRT to ASS format and burns into video.
    
    Video Format Info:
    - Input: VTT or SRT subtitle files
    - Conversion: ASS format for advanced styling
    - Output: MP4 with burned-in subtitles (H.264)
    """
    
    # Font sizes
    FONT_SIZES = {
        "small": 28,
        "medium": 36,
        "large": 48,
    }
    
    def __init__(self, ffmpeg_utils: FFmpegUtils, font_path: Optional[str] = None):
        self.ffmpeg = ffmpeg_utils
        self.font_path = font_path
    
    async def burn_subtitles(
        self,
        video_path: str,
        subtitle_path: str,
        options: SubtitleOptions,
        work_dir: Path,
    ) -> str:
        """
        Burn subtitles into video.
        
        Video Format:
        - Output codec: H.264 (libx264)
        - Preset: fast
        - CRF: 23 (good quality/size balance)
        """
        output_path = work_dir / "with_subs.mp4"
        
        # Convert subtitle to ASS for better styling
        ass_path = await self._convert_to_ass(subtitle_path, options, work_dir)
        
        # Escape path for FFmpeg (Windows compatibility)
        ass_path_escaped = str(ass_path).replace("\\", "/").replace(":", "\\\\:")
        
        cmd = [
            self.ffmpeg.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", f"ass={ass_path_escaped}",
            "-c:a", "copy",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            str(output_path)
        ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
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
        positions = {"top": 20, "center": 200, "bottom": 50}
        margin_v = positions.get(options.position, 50)
        
        # Background style
        backgrounds = {"none": 0, "semi": 1, "solid": 3}
        border_style = backgrounds.get(options.background, 1)
        
        # Color conversion
        color = self._normalize_hex_color(options.color)
        ass_color = f"&H00{color[4:6]}{color[2:4]}{color[0:2]}"
        
        # ASS header
        ass_content = f"""[Script Info]
Title: Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Pyidaungsu,{font_size},{ass_color},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,{border_style},2,1,2,10,10,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Check if SRT format
        is_srt = subtitle_path.lower().endswith('.srt')
        
        if is_srt:
            logger.info("Using SRT parser for subtitle file")
            ass_content = self._parse_srt_fallback(subtitle_path, ass_content)
        else:
            try:
                for caption in webvtt.read(subtitle_path):
                    start = self._time_to_ass(caption.start)
                    end = self._time_to_ass(caption.end)
                    text = caption.text.replace("\n", "\\N")
                    ass_content += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
            except Exception as e:
                logger.warning(f"webvtt-py parsing failed, using fallback: {e}")
                ass_content = self._parse_srt_fallback(subtitle_path, ass_content)
        
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)
        
        return ass_path
    
    def _time_to_ass(self, time_str: str) -> str:
        """Convert VTT time (HH:MM:SS.mmm) to ASS time (H:MM:SS.cc)."""
        parts = time_str.replace(",", ".").split(":")
        if len(parts) == 2:
            parts.insert(0, "0")
        
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_ms = parts[2].split(".")
        seconds = int(seconds_ms[0])
        ms = seconds_ms[1][:2] if len(seconds_ms) > 1 else "00"
        
        return f"{hours}:{minutes:02d}:{seconds:02d}.{ms}"
    
    def _parse_srt_fallback(self, subtitle_path: str, ass_header: str) -> str:
        """Fallback SRT/VTT parser if webvtt-py fails."""
        with open(subtitle_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        lines = content.split("\n")
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if line.isdigit():
                i += 1
                continue
            
            if line.upper().startswith("WEBVTT"):
                i += 1
                continue
            
            if "-->" in line:
                times = line.split("-->")
                start = self._time_to_ass(times[0].strip())
                end = self._time_to_ass(times[1].strip().split()[0])
                
                i += 1
                text_lines = []
                while i < len(lines) and lines[i].strip():
                    text_lines.append(lines[i].strip())
                    i += 1
                text = "\\N".join(text_lines)
                
                ass_header += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
            
            i += 1
        
        return ass_header
    
    def _normalize_hex_color(self, color: str) -> str:
        """Normalize hex color to 6-digit format."""
        color = color.replace("#", "").upper()
        if len(color) == 3:
            color = "".join([c * 2 for c in color])
        return color
