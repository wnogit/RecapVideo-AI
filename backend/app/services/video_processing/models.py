"""
Video Processing - Models/Options
Shared dataclasses for video processing options
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CopyrightOptions:
    """Copyright bypass options."""
    color_adjust: bool = True
    horizontal_flip: bool = True
    slight_zoom: bool = False
    audio_pitch_shift: bool = True
    pitch_value: float = 1.0  # Pitch multiplier (0.5-1.5)


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
class BlurRegion:
    """Single blur region (percentage-based)."""
    x: float = 0.0      # Left position (0-100%)
    y: float = 0.0      # Top position (0-100%)
    width: float = 0.0  # Width (0-100%)
    height: float = 0.0 # Height (0-100%)


@dataclass
class BlurOptions:
    """Region-based blur options to mask watermarks/logos."""
    enabled: bool = False
    intensity: int = 15  # 5-30
    blur_type: str = "gaussian"  # gaussian, box
    regions: list = field(default_factory=list)  # List of BlurRegion


@dataclass
class CropOptions:
    """Custom crop options for selecting which region of video to show."""
    enabled: bool = False
    x: float = 0.0       # Left position (0-100%)
    y: float = 0.0       # Top position (0-100%)
    width: float = 100.0  # Width (0-100%)
    height: float = 100.0 # Height (0-100%)


@dataclass
class AudioEnhanceOptions:
    """Audio enhancement options."""
    normalize: bool = True  # EBU R128 loudness normalization
    target_loudness: float = -16.0  # LUFS (-24 to -12)
    true_peak: float = -1.5  # dB (-3 to 0)


@dataclass
class VideoEnhanceOptions:
    """Video enhancement options."""
    sharpen_enabled: bool = False  # Contrast Adaptive Sharpen
    sharpen_strength: float = 0.3  # 0.0 to 1.0


@dataclass
class VideoProcessingOptions:
    """All video processing options."""
    aspect_ratio: str = "9:16"  # 9:16, 16:9, 1:1, 4:5
    blur: BlurOptions = field(default_factory=BlurOptions)
    crop: CropOptions = field(default_factory=CropOptions)
    copyright: CopyrightOptions = field(default_factory=CopyrightOptions)
    subtitles: SubtitleOptions = field(default_factory=SubtitleOptions)
    logo: LogoOptions = field(default_factory=LogoOptions)
    outro: OutroOptions = field(default_factory=OutroOptions)
    audio_enhance: AudioEnhanceOptions = field(default_factory=AudioEnhanceOptions)
    video_enhance: VideoEnhanceOptions = field(default_factory=VideoEnhanceOptions)


