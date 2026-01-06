"""
Video Schemas
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.models.video import VideoStatus, VoiceType


class VideoCreate(BaseModel):
    """Schema for video creation."""
    source_url: str = Field(..., description="YouTube video URL")
    voice_type: str = Field(
        default=VoiceType.FEMALE_BURMESE.value,
        description="Voice type for TTS"
    )
    output_language: str = Field(default="my", description="Output language code")
    output_resolution: str = Field(default="1080p", description="Output resolution")
    
    @field_validator("source_url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        """Validate YouTube URL."""
        import re
        youtube_patterns = [
            r'(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
            r'(https?://)?(www\.)?youtu\.be/[\w-]+',
            r'(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
        ]
        if not any(re.match(pattern, v) for pattern in youtube_patterns):
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
