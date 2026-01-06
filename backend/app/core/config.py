"""
Application Configuration using Pydantic Settings
"""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    # Application
    PROJECT_NAME: str = "RecapVideo.AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recapvideo"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis (for caching and future Celery workers)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://studio.recapvideo.ai"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # Cloudflare R2 Storage
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "recapvideo"
    R2_PUBLIC_URL: str = "https://videos.recapvideo.ai"
    
    # TranscriptAPI.com
    TRANSCRIPT_API_KEY: str = ""
    TRANSCRIPT_API_URL: str = "https://api.transcriptapi.com"
    
    # Google Gemini (TTS fallback)
    GEMINI_API_KEY: str = ""
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Resend Email
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@recapvideo.ai"
    
    # Payment
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"  # sandbox or live
    
    # TTS Configuration
    EDGE_TTS_VOICE_FEMALE: str = "my-MM-NilarNeural"  # Burmese female
    EDGE_TTS_VOICE_MALE: str = "my-MM-ThihaNeural"    # Burmese male
    EDGE_TTS_VOICE_DEFAULT: str = "en-US-JennyNeural" # English fallback
    
    # Video Processing
    MAX_VIDEO_DURATION_MINUTES: int = 60
    DEFAULT_OUTPUT_RESOLUTION: str = "1080p"
    TEMP_FILES_DIR: str = "/tmp/recapvideo"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL for Alembic."""
        return self.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")


settings = Settings()
