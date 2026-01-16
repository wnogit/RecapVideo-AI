"""
Application Configuration using Pydantic Settings
"""
from typing import List
from pydantic import field_validator, computed_field
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
    
    # Cookie settings for HttpOnly tokens
    COOKIE_DOMAIN: str = ".recapvideo.ai"  # Allows sharing between subdomains
    COOKIE_SECURE: bool = True  # Only send over HTTPS
    COOKIE_SAMESITE: str = "lax"  # Protect against CSRF while allowing normal links
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Ensure JWT secret key is not the default value in production."""
        import os
        env = os.getenv("ENVIRONMENT", "development")
        if env == "production" and v == "your-super-secret-key-change-in-production":
            raise ValueError(
                "CRITICAL: JWT_SECRET_KEY must be changed from default value in production!"
            )
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    # CORS - store as string to avoid pydantic_settings JSON parsing issues
    CORS_ORIGINS_STR: str = "http://localhost:3000,https://studio.recapvideo.ai,https://recapvideo.ai,https://www.recapvideo.ai"
    
    @computed_field
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",")]
    
    # Cloudflare R2 Storage
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "recapvideo"
    R2_PUBLIC_URL: str = "https://videos.recapvideo.ai"
    
    # Backend URL (for static file serving, telegram screenshots)
    BACKEND_URL: str = "https://api.recapvideo.ai"
    
    # TranscriptAPI.com
    TRANSCRIPT_API_KEY: str = ""
    TRANSCRIPT_API_URL: str = "https://transcriptapi.com"
    
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
    
    # Telegram Bot (for order notifications)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_ADMIN_CHAT_ID: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""  # Optional secret for webhook validation
    
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
