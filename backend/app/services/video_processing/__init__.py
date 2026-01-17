"""
Video Processing Package
Modular video processing services for FFmpeg operations.

This package contains:
- models.py: Dataclasses for processing options
- ffmpeg_utils.py: FFmpeg command utilities
- single_pass_processor.py: OPTIMIZED single-pass processing (3-5x faster)
- blur_service.py: Blur effect processing
- subtitle_service.py: Subtitle burning
- logo_service.py: Logo overlay
- audio_service.py: Audio replacement/pitch
- outro_service.py: Outro generation
- copyright_service.py: Copyright bypass filters

Video Format Summary:
=====================
- Output Format: MP4 (H.264 video + AAC audio)
- Video Codec: libx264
- Preset: ultrafast (optimized for speed)
- CRF: 23 (good quality, moderate file size)
- Audio Codec: AAC @ 192kbps

Aspect Ratios Supported:
- 9:16 (1080x1920) - TikTok, YouTube Shorts
- 16:9 (1920x1080) - YouTube
- 1:1 (1080x1080) - Instagram Square
- 4:5 (1080x1350) - Instagram Portrait

OPTIMIZATION (2026-01-17):
- Single-pass FFmpeg processing: 10+ min → 2-3 min
- Feature flag: USE_SINGLE_PASS=true (default)
"""

from .models import (
    CopyrightOptions,
    SubtitleOptions,
    LogoOptions,
    OutroOptions,
    BlurRegion,
    BlurOptions,
    CropOptions,
    VideoProcessingOptions,
)

from .ffmpeg_utils import FFmpegUtils, ffmpeg_utils
from .blur_service import BlurService
from .subtitle_service import SubtitleService
from .logo_service import LogoService
from .audio_service import AudioService
from .outro_service import OutroService
from .copyright_service import CopyrightService
from .resize_service import ResizeService
from .main_service import VideoProcessingService
from .single_pass_processor import SinglePassProcessor, SinglePassProcessorV2


__all__ = [
    # Models
    "CopyrightOptions",
    "SubtitleOptions",
    "LogoOptions",
    "OutroOptions",
    "BlurRegion",
    "BlurOptions",
    "CropOptions",
    "VideoProcessingOptions",
    # Services
    "FFmpegUtils",
    "ffmpeg_utils",
    "BlurService",
    "SubtitleService",
    "LogoService",
    "AudioService",
    "OutroService",
    "CopyrightService",
    "ResizeService",
    "VideoProcessingService",
    # Optimized processors
    "SinglePassProcessor",
    "SinglePassProcessorV2",
]

