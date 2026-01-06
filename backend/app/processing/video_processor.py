"""
Video Processing Pipeline

This module handles the complete video generation workflow:
1. Extract transcript from YouTube video
2. Generate recap script using Gemini
3. Generate audio using Edge-TTS
4. Render final video with ffmpeg
5. Upload to Cloudflare R2

Currently runs inline (single VPS). Foundation ready for Celery workers.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.video import Video, VideoStatus
from app.models.credit import CreditTransaction, TransactionType
from app.services.transcript_service import transcript_service
from app.services.script_service import script_service
from app.services.tts_service import edge_tts_service
from app.services.storage_service import storage_service
from app.services.email_service import email_service


class VideoProcessor:
    """Video processing pipeline."""
    
    def __init__(self):
        """Initialize video processor."""
        self.temp_dir = Path(settings.TEMP_FILES_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    async def process_video(self, video_id: str) -> bool:
        """
        Process a video from start to finish.
        
        Args:
            video_id: UUID of the video to process
        
        Returns:
            True if processing completed successfully
        """
        async with async_session_maker() as db:
            try:
                # Get video
                result = await db.execute(
                    select(Video).where(Video.id == video_id)
                )
                video = result.scalar_one_or_none()
                
                if not video:
                    logger.error(f"Video not found: {video_id}")
                    return False
                
                if video.status != VideoStatus.PENDING.value:
                    logger.warning(f"Video {video_id} is not pending, skipping")
                    return False
                
                logger.info(f"Starting processing for video: {video_id}")
                
                # Update status
                video.started_at = datetime.now(timezone.utc)
                await self._update_status(
                    db, video,
                    VideoStatus.EXTRACTING_TRANSCRIPT,
                    "Extracting transcript from YouTube video...",
                    10
                )
                
                # Step 1: Extract transcript
                transcript_data = await self._extract_transcript(video)
                video.source_title = transcript_data.get("title", video.source_url)
                video.transcript = transcript_data["text"]
                video.source_duration_seconds = transcript_data.get("duration")
                
                await self._update_status(
                    db, video,
                    VideoStatus.GENERATING_SCRIPT,
                    "Generating recap script with AI...",
                    30
                )
                
                # Step 2: Generate script
                script = await self._generate_script(video)
                video.script = script
                
                await self._update_status(
                    db, video,
                    VideoStatus.GENERATING_AUDIO,
                    "Generating voiceover audio...",
                    50
                )
                
                # Step 3: Generate audio
                audio_path, subtitle_path = await self._generate_audio(video)
                
                await self._update_status(
                    db, video,
                    VideoStatus.RENDERING_VIDEO,
                    "Rendering final video...",
                    70
                )
                
                # Step 4: Render video (placeholder - actual implementation would use ffmpeg)
                video_path = await self._render_video(video, audio_path, subtitle_path)
                
                await self._update_status(
                    db, video,
                    VideoStatus.UPLOADING,
                    "Uploading to cloud storage...",
                    90
                )
                
                # Step 5: Upload to R2
                video_url = await self._upload_files(video, video_path, audio_path)
                video.video_url = video_url
                video.audio_url = await storage_service.upload_file(audio_path, folder="audio")
                
                # Get file info
                video_file = Path(video_path)
                if video_file.exists():
                    video.file_size_bytes = video_file.stat().st_size
                
                # Complete!
                video.status = VideoStatus.COMPLETED.value
                video.status_message = "Video ready!"
                video.progress_percent = 100
                video.completed_at = datetime.now(timezone.utc)
                
                await db.commit()
                
                logger.info(f"Video processing completed: {video_id}")
                
                # Cleanup temp files
                self._cleanup_temp_files([video_path, audio_path, subtitle_path])
                
                # Send notification email (async, don't wait)
                asyncio.create_task(self._send_completion_email(video))
                
                return True
                
            except Exception as e:
                logger.exception(f"Video processing failed: {video_id}")
                
                # Update status to failed
                video.status = VideoStatus.FAILED.value
                video.error_message = str(e)
                video.status_message = "Processing failed. Credits will be refunded."
                video.retry_count += 1
                
                # Refund credits
                await self._refund_credits(db, video)
                
                await db.commit()
                
                return False
    
    async def _extract_transcript(self, video: Video) -> dict:
        """Extract transcript from YouTube video."""
        logger.info(f"Extracting transcript from: {video.source_url}")
        
        # Get video info first
        video_info = await transcript_service.get_video_info(video.source_url)
        
        # Get transcript
        transcript_data = await transcript_service.get_transcript(
            video.source_url,
            language="en",  # Try English first, TranscriptAPI handles fallback
        )
        
        transcript_data["title"] = video_info.get("title")
        transcript_data["thumbnail"] = video_info.get("thumbnail")
        
        return transcript_data
    
    async def _generate_script(self, video: Video) -> str:
        """Generate recap script using Gemini."""
        logger.info(f"Generating script for: {video.source_title}")
        
        script = await script_service.generate_script(
            transcript=video.transcript,
            video_title=video.source_title,
            target_language=video.output_language,
        )
        
        return script
    
    async def _generate_audio(self, video: Video) -> tuple[str, str]:
        """Generate audio using Edge-TTS."""
        logger.info(f"Generating audio with voice: {video.voice_type}")
        
        audio_path, subtitle_path = await edge_tts_service.synthesize(
            text=video.script,
            voice=video.voice_type,
        )
        
        return audio_path, subtitle_path
    
    async def _render_video(
        self,
        video: Video,
        audio_path: str,
        subtitle_path: str,
    ) -> str:
        """
        Render final video with ffmpeg.
        
        This is a placeholder - actual implementation would:
        1. Download source video or use placeholder background
        2. Overlay subtitles
        3. Replace audio with TTS audio
        4. Export final video
        """
        logger.info(f"Rendering video: {video.id}")
        
        # For now, just return the audio as the "video"
        # TODO: Implement actual video rendering with ffmpeg
        
        output_path = str(self.temp_dir / f"{video.id}_output.mp4")
        
        # Placeholder: In production, this would use ffmpeg to create actual video
        # For now, we'll create a simple video from the audio
        
        # Example ffmpeg command (would be run with subprocess):
        # ffmpeg -f lavfi -i color=c=black:s=1920x1080:r=30 \
        #        -i audio.mp3 -shortest -c:v libx264 -c:a aac output.mp4
        
        # For now, just copy audio to output location
        import shutil
        shutil.copy(audio_path, output_path)
        
        return output_path
    
    async def _upload_files(
        self,
        video: Video,
        video_path: str,
        audio_path: str,
    ) -> str:
        """Upload video and audio files to R2."""
        logger.info(f"Uploading files for video: {video.id}")
        
        video_url = await storage_service.upload_file(
            video_path,
            key=f"videos/{video.id}.mp4",
            content_type="video/mp4",
        )
        
        return video_url
    
    async def _update_status(
        self,
        db: AsyncSession,
        video: Video,
        status: VideoStatus,
        message: str,
        progress: int,
    ):
        """Update video status."""
        video.status = status.value
        video.status_message = message
        video.progress_percent = progress
        await db.commit()
        await db.refresh(video)
    
    async def _refund_credits(self, db: AsyncSession, video: Video):
        """Refund credits for failed video."""
        if video.credits_refunded:
            return
        
        # Get user
        from app.models.user import User
        result = await db.execute(
            select(User).where(User.id == video.user_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.credit_balance += video.credits_used
            video.credits_refunded = True
            
            # Record refund transaction
            transaction = CreditTransaction(
                user_id=user.id,
                transaction_type=TransactionType.REFUND.value,
                amount=video.credits_used,
                balance_after=user.credit_balance,
                reference_type="video",
                reference_id=str(video.id),
                description="Video processing failed - credits refunded",
            )
            db.add(transaction)
    
    async def _send_completion_email(self, video: Video):
        """Send email notification when video is complete."""
        try:
            from app.models.user import User
            async with async_session_maker() as db:
                result = await db.execute(
                    select(User).where(User.id == video.user_id)
                )
                user = result.scalar_one_or_none()
                
                if user:
                    await email_service.send_video_complete_email(
                        to=user.email,
                        name=user.name,
                        video_title=video.source_title or "Your video",
                        video_url=video.video_url,
                    )
        except Exception as e:
            logger.warning(f"Failed to send completion email: {e}")
    
    def _cleanup_temp_files(self, paths: list[str]):
        """Clean up temporary files."""
        for path in paths:
            if path:
                try:
                    p = Path(path)
                    if p.exists():
                        p.unlink()
                except Exception as e:
                    logger.warning(f"Failed to cleanup {path}: {e}")


# Singleton instance
video_processor = VideoProcessor()


async def process_video_task(video_id: str):
    """
    Task function for processing a video.
    
    This function can be called:
    - Directly (single VPS mode)
    - By Celery worker (scaled mode - future)
    """
    return await video_processor.process_video(video_id)
