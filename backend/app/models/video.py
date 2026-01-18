"""
Video Model
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class VideoStatus(str, Enum):
    """Video processing status."""
    PENDING = "pending"
    EXTRACTING_TRANSCRIPT = "extracting_transcript"
    GENERATING_SCRIPT = "generating_script"
    GENERATING_AUDIO = "generating_audio"
    RENDERING_VIDEO = "rendering_video"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VideoPlatform(str, Enum):
    """Supported video platforms."""
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"


class VoiceType(str, Enum):
    """Available voice types for TTS."""
    FEMALE_BURMESE = "my-MM-NilarNeural"
    MALE_BURMESE = "my-MM-ThihaNeural"
    FEMALE_ENGLISH = "en-US-JennyNeural"
    MALE_ENGLISH = "en-US-GuyNeural"


# Default video options
DEFAULT_VIDEO_OPTIONS = {
    "aspect_ratio": "9:16",
    "copyright": {
        "color_adjust": True,
        "horizontal_flip": True,
        "slight_zoom": False,
        "audio_pitch_shift": True,
    },
    "subtitles": {
        "enabled": True,
        "size": "large",
        "position": "bottom",
        "background": "semi",
        "color": "#FFFFFF",
        "word_highlight": True,
    },
    "logo": {
        "enabled": False,
        "image_url": None,
        "position": "top-right",
        "size": "medium",
        "opacity": 70,
    },
    "outro": {
        "enabled": False,
        "platform": "youtube",
        "channel_name": "",
        "use_logo": False,
        "duration": 5,
    },
}


class Video(Base):
    """Video model for tracking video generation."""
    
    __tablename__ = "videos"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Foreign key
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Source info
    platform: Mapped[str] = mapped_column(
        String(20), 
        default=VideoPlatform.YOUTUBE.value,
        index=True,
    )
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_video_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)  # Video ID for any platform
    youtube_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)  # Keep for backward compatibility
    source_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Generated content
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    script: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Processing options
    voice_type: Mapped[str] = mapped_column(
        String(50),
        default=VoiceType.FEMALE_BURMESE.value,
    )
    output_language: Mapped[str] = mapped_column(String(10), default="my")  # my = Burmese
    output_resolution: Mapped[str] = mapped_column(String(20), default="1080p")
    
    # Video processing options (copyright, subtitles, logo, outro)
    options: Mapped[Dict[str, Any] | None] = mapped_column(
        JSONB,
        default=lambda: DEFAULT_VIDEO_OPTIONS.copy(),
        nullable=True,
    )
    
    # Output
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default=VideoStatus.PENDING.value,
        index=True,
    )
    status_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    
    # Error tracking
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Credits
    credits_used: Mapped[int] = mapped_column(Integer, default=1)
    credits_refunded: Mapped[bool] = mapped_column(default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="videos")
    
    def __repr__(self) -> str:
        return f"<Video {self.id} - {self.status}>"
    
    @property
    def is_processing(self) -> bool:
        """Check if video is currently being processed."""
        return self.status in [
            VideoStatus.PENDING.value,
            VideoStatus.EXTRACTING_TRANSCRIPT.value,
            VideoStatus.GENERATING_SCRIPT.value,
            VideoStatus.GENERATING_AUDIO.value,
            VideoStatus.RENDERING_VIDEO.value,
            VideoStatus.UPLOADING.value,
        ]
    
    @property
    def is_completed(self) -> bool:
        """Check if video processing is completed."""
        return self.status == VideoStatus.COMPLETED.value
    
    @property
    def is_failed(self) -> bool:
        """Check if video processing failed."""
        return self.status == VideoStatus.FAILED.value
