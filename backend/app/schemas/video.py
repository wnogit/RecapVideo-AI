"""
Video Schemas
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.models.video import VideoStatus, VoiceType
from app.utils.youtube import is_youtube_url


# ===== Video Processing Options Schemas =====

class CopyrightOptionsSchema(BaseModel):
    """Copyright bypass options."""
    color_adjust: bool = Field(default=True, description="Adjust colors slightly")
    horizontal_flip: bool = Field(default=False, description="Flip video horizontally")
    slight_zoom: bool = Field(default=False, description="Apply slight zoom effect")
    audio_pitch_shift: bool = Field(default=False, description="Shift audio pitch slightly")
    pitch_value: float = Field(default=1.0, ge=0.5, le=1.5, description="Pitch multiplier (0.5-1.5, default 1.0)")


class SubtitleOptionsSchema(BaseModel):
    """Subtitle options."""
    enabled: bool = Field(default=True, description="Enable subtitles")
    size: str = Field(default="large", description="Font size (small/medium/large)")
    position: str = Field(default="bottom", description="Position (top/center/bottom)")
    background: str = Field(default="semi", description="Background style (none/semi/solid)")
    color: str = Field(default="#FFFFFF", description="Text color hex")
    word_highlight: bool = Field(default=True, description="Highlight current word")
    
    @field_validator("size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        if v not in ["small", "medium", "large"]:
            raise ValueError("Size must be small, medium, or large")
        return v
    
    @field_validator("position")
    @classmethod
    def validate_position(cls, v: str) -> str:
        if v not in ["top", "center", "bottom"]:
            raise ValueError("Position must be top, center, or bottom")
        return v


class LogoOptionsSchema(BaseModel):
    """Logo overlay options."""
    enabled: bool = Field(default=False, description="Enable logo overlay")
    image_url: Optional[str] = Field(default=None, description="Logo image URL from R2")
    position: str = Field(default="top-right", description="Logo position")
    size: str = Field(default="medium", description="Logo size (small/medium/large)")
    opacity: int = Field(default=70, ge=0, le=100, description="Logo opacity 0-100")
    
    @field_validator("position")
    @classmethod
    def validate_position(cls, v: str) -> str:
        valid = ["top-left", "top-right", "bottom-left", "bottom-right"]
        if v not in valid:
            raise ValueError(f"Position must be one of: {valid}")
        return v


class OutroOptionsSchema(BaseModel):
    """Outro options."""
    enabled: bool = Field(default=False, description="Enable outro")
    platform: str = Field(default="youtube", description="Platform style")
    channel_name: str = Field(default="", description="Channel name to display")
    use_logo: bool = Field(default=False, description="Use uploaded logo in outro")
    duration: int = Field(default=5, ge=3, le=7, description="Outro duration 3-7 seconds")
    
    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        valid = ["youtube", "tiktok", "facebook", "instagram"]
        if v not in valid:
            raise ValueError(f"Platform must be one of: {valid}")
        return v


class BlurRegionSchema(BaseModel):
    """Single blur region (percentage-based)."""
    x: float = Field(ge=0, le=100, description="Left position (0-100%)")
    y: float = Field(ge=0, le=100, description="Top position (0-100%)")
    width: float = Field(ge=0, le=100, description="Width (0-100%)")
    height: float = Field(ge=0, le=100, description="Height (0-100%)")


class BlurOptionsSchema(BaseModel):
    """Region-based blur options to mask watermarks/logos."""
    enabled: bool = Field(default=False, description="Enable blur effect")
    intensity: int = Field(default=15, ge=5, le=30, description="Blur intensity 5-30")
    blur_type: str = Field(default="gaussian", description="Blur type (gaussian/box)")
    regions: List[BlurRegionSchema] = Field(default_factory=list, description="Blur regions")
    
    @field_validator("blur_type")
    @classmethod
    def validate_blur_type(cls, v: str) -> str:
        valid = ["gaussian", "box"]
        if v not in valid:
            raise ValueError(f"Blur type must be one of: {valid}")
        return v


class VideoOptionsSchema(BaseModel):
    """All video processing options."""
    aspect_ratio: str = Field(default="9:16", description="Output aspect ratio")
    copyright: CopyrightOptionsSchema = Field(default_factory=CopyrightOptionsSchema)
    subtitles: SubtitleOptionsSchema = Field(default_factory=SubtitleOptionsSchema)
    logo: LogoOptionsSchema = Field(default_factory=LogoOptionsSchema)
    outro: OutroOptionsSchema = Field(default_factory=OutroOptionsSchema)
    blur: BlurOptionsSchema = Field(default_factory=BlurOptionsSchema)
    
    @field_validator("aspect_ratio")
    @classmethod
    def validate_aspect_ratio(cls, v: str) -> str:
        valid = ["9:16", "16:9", "1:1", "4:5"]
        if v not in valid:
            raise ValueError(f"Aspect ratio must be one of: {valid}")
        return v


# ===== Video Create/Response Schemas =====

class VideoCreate(BaseModel):
    """Schema for video creation."""
    source_url: str = Field(..., description="YouTube video URL")
    voice_type: str = Field(
        default=VoiceType.FEMALE_BURMESE.value,
        description="Voice type for TTS"
    )
    output_language: str = Field(default="my", description="Output language code")
    output_resolution: str = Field(default="1080p", description="Output resolution")
    options: VideoOptionsSchema = Field(
        default_factory=VideoOptionsSchema,
        description="Video processing options"
    )
    
    @field_validator("source_url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        """Validate YouTube URL."""
        if not is_youtube_url(v):
            raise ValueError("Invalid YouTube URL")
        return v
    
    @field_validator("voice_type")
    @classmethod
    def validate_voice_type(cls, v: str) -> str:
        """Validate voice type."""
        valid_voices = [e.value for e in VoiceType]
        if v not in valid_voices:
            raise ValueError(f"Invalid voice type. Valid options: {valid_voices}")
        return v


class VideoResponse(BaseModel):
    """Schema for video response."""
    id: UUID
    user_id: UUID
    
    # Source info
    source_url: str
    source_title: Optional[str] = None
    source_thumbnail: Optional[str] = None
    source_duration_seconds: Optional[int] = None
    
    # Generated content
    title: Optional[str] = None
    transcript: Optional[str] = None
    script: Optional[str] = None
    
    # Options
    voice_type: str
    output_language: str
    output_resolution: str
    options: Optional[Dict[str, Any]] = None  # JSON options
    
    # Output
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    file_size_bytes: Optional[int] = None
    
    # Status
    status: str
    status_message: Optional[str] = None
    progress_percent: int
    error_message: Optional[str] = None
    
    # Credits
    credits_used: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class VideoListResponse(BaseModel):
    """Schema for paginated video list."""
    videos: List[VideoResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class VideoStatusUpdate(BaseModel):
    """Schema for video status update (internal use)."""
    status: str
    status_message: Optional[str] = None
    progress_percent: Optional[int] = None
    error_message: Optional[str] = None
    
    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate status."""
        valid_statuses = [e.value for e in VideoStatus]
        if v not in valid_statuses:
            raise ValueError(f"Invalid status. Valid options: {valid_statuses}")
        return v


class VideoSummary(BaseModel):
    """Schema for video summary (minimal info)."""
    id: UUID
    title: Optional[str] = None
    source_thumbnail: Optional[str] = None
    status: str
    progress_percent: int
    created_at: datetime
    
    model_config = {"from_attributes": True}
