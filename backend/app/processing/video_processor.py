"""
Video Processing Pipeline

This module handles the complete video generation workflow:
1. Extract transcript from YouTube video
2. Generate recap script using Gemini
3. Generate audio using Edge-TTS
4. Render final video with FFmpeg (copyright bypass, subtitles, logo, outro)
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
from app.core.database import create_worker_session_maker
from app.models.video import Video, VideoStatus, DEFAULT_VIDEO_OPTIONS
from app.models.credit import CreditTransaction, TransactionType
from app.services.transcript_service import transcript_service
from app.services.script_service import script_service
from app.services.tts_service import edge_tts_service
from app.services.storage_service import storage_service
from app.services.email_service import email_service
from app.services.video_processing import (
    VideoProcessingService,
    VideoProcessingOptions,
    CopyrightOptions,
    SubtitleOptions,
    LogoOptions,
    OutroOptions,
    BlurOptions,
    BlurRegion,
    CropOptions,
)


class VideoProcessor:
    """Video processing pipeline."""
    
    def __init__(self):
        """Initialize video processor."""
        self.temp_dir = Path(settings.TEMP_FILES_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.video_processing = VideoProcessingService()
    
    def _parse_options(self, options_dict: dict | None) -> VideoProcessingOptions:
        """Parse options dict to VideoProcessingOptions."""
        if not options_dict:
            options_dict = DEFAULT_VIDEO_OPTIONS.copy()
        
        copyright_opts = options_dict.get("copyright", {})
        subtitle_opts = options_dict.get("subtitles", {})
        logo_opts = options_dict.get("logo", {})
        outro_opts = options_dict.get("outro", {})
        blur_opts = options_dict.get("blur", {})
        crop_opts = options_dict.get("crop", {})
        blur_regions_raw = blur_opts.get("regions", [])
        blur_regions = [
            BlurRegion(
                x=float(r.get("x", 0)),
                y=float(r.get("y", 0)),
                width=float(r.get("width", 0)),
                height=float(r.get("height", 0)),
            )
            for r in blur_regions_raw
        ]
        
        return VideoProcessingOptions(
            aspect_ratio=options_dict.get("aspect_ratio", "9:16"),
            blur=BlurOptions(
                enabled=blur_opts.get("enabled", False) or len(blur_regions) > 0,
                intensity=int(blur_opts.get("intensity", 15)),
                blur_type=blur_opts.get("blur_type", blur_opts.get("blurType", "gaussian")),
                regions=blur_regions,
            ),
            crop=CropOptions(
                enabled=crop_opts.get("enabled", False),
                x=float(crop_opts.get("x", 0)),
                y=float(crop_opts.get("y", 0)),
                width=float(crop_opts.get("width", 100)),
                height=float(crop_opts.get("height", 100)),
            ),
            copyright=CopyrightOptions(
                color_adjust=copyright_opts.get("color_adjust", True),
                horizontal_flip=copyright_opts.get("horizontal_flip", True),
                slight_zoom=copyright_opts.get("slight_zoom", False),
                audio_pitch_shift=copyright_opts.get("audio_pitch_shift", True),
                pitch_value=float(copyright_opts.get("pitch_value", copyright_opts.get("pitchValue", 1.0))),
            ),
            subtitles=SubtitleOptions(
                enabled=subtitle_opts.get("enabled", True),
                size=subtitle_opts.get("size", "large"),
                position=subtitle_opts.get("position", "bottom"),
                background=subtitle_opts.get("background", "semi"),
                color=subtitle_opts.get("color", "#FFFFFF"),
                word_highlight=subtitle_opts.get("word_highlight", True),
            ),
            logo=LogoOptions(
                enabled=logo_opts.get("enabled", False),
                image_path=logo_opts.get("image_url"),  # Will download if needed
                position=logo_opts.get("position", "top-right"),
                size=logo_opts.get("size", "medium"),
                opacity=logo_opts.get("opacity", 70),
            ),
            outro=OutroOptions(
                enabled=outro_opts.get("enabled", False),
                platform=outro_opts.get("platform", "youtube"),
                channel_name=outro_opts.get("channel_name", "") or "RecapVideo",  # Default if empty
                logo_path=logo_opts.get("image_url") if outro_opts.get("use_logo") else None,
                duration=outro_opts.get("duration", 5),
            ),
        )
    
    async def process_video(self, video_id: str) -> bool:
        """
        Process a video from start to finish.
        
        Args:
            video_id: UUID of the video to process
        
        Returns:
            True if processing completed successfully
        """
        # Create worker-specific session maker to avoid event loop issues
        worker_session_maker = create_worker_session_maker()
        
        async with worker_session_maker() as db:
            video = None
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
                
                # Parse options
                processing_options = self._parse_options(video.options)
                
                # Update status
                video.started_at = datetime.now(timezone.utc)
                await self._update_status(
                    db, video,
                    VideoStatus.EXTRACTING_TRANSCRIPT,
                    "🎬 Video ကို လေ့လာနေပါတယ်...",
                    10
                )
                
                # Step 1: Extract transcript
                transcript_data = await self._extract_transcript(video)
                video.source_title = transcript_data.get("title", video.source_url)
                video.transcript = transcript_data["text"]
                video.source_duration_seconds = transcript_data.get("duration")
                video.source_thumbnail = transcript_data.get("thumbnail")
                
                await self._update_status(
                    db, video,
                    VideoStatus.GENERATING_SCRIPT,
                    "✍️ Script ရေးနေပါတယ် + Video ဒေါင်းလုဒ်လုပ်နေပါတယ်...",
                    30
                )
                
                # ============================================
                # OPTIMIZED: Parallel processing with asyncio.gather()
                # Script generation + Video download run simultaneously
                # Saves 1-3 minutes per video
                # ============================================
                logger.info("[PARALLEL] Starting parallel: Script generation + Video download")
                
                # Run script generation and video download in parallel
                script_task = self._generate_script(video)
                download_task = self._download_source_video(video)
                
                script, source_video_path = await asyncio.gather(
                    script_task,
                    download_task,
                    return_exceptions=False  # Raise exception if any task fails
                )
                
                video.script = script
                logger.info("[PARALLEL] Completed: Script generation + Video download")
                
                await self._update_status(
                    db, video,
                    VideoStatus.GENERATING_AUDIO,
                    "🎙️ အသံသွင်းနေပါတယ်...",
                    50
                )
                
                # Step 3: Generate audio (needs script, so can't be parallelized with above)
                audio_path, subtitle_path = await self._generate_audio(video)
                
                await self._update_status(
                    db, video,
                    VideoStatus.RENDERING_VIDEO,
                    "🎨 Video ပြင်ဆင်နေပါတယ်...",
                    70
                )
                
                # Step 4: Process video with FFmpeg (source video already downloaded)
                # Prepare output path for processed video
                output_video_path = str(self.temp_dir / f"processed_{video_id}.mp4")
                
                # Debug: Log subtitle and outro status
                logger.info(f"[DEBUG] subtitle_path: {subtitle_path}")
                logger.info(f"[DEBUG] subtitles.enabled: {processing_options.subtitles.enabled if processing_options.subtitles else 'N/A'}")
                logger.info(f"[DEBUG] outro.enabled: {processing_options.outro.enabled if processing_options.outro else 'N/A'}")
                
                # Process video with all effects
                video_path = await self.video_processing.process_video(
                    source_video=source_video_path,
                    output_path=output_video_path,
                    options=processing_options,
                    audio_path=audio_path,
                    subtitle_path=subtitle_path if (processing_options.subtitles and processing_options.subtitles.enabled) else None,
                )
                
                await self._update_status(
                    db, video,
                    VideoStatus.UPLOADING,
                    "☁️ မကြာခင် ပြီးပါပြီ...",
                    92
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
                self._cleanup_temp_files([video_path, audio_path, subtitle_path, source_video_path])
                
                # Send notification email (async, don't wait)
                asyncio.create_task(self._send_completion_email(video))
                
                return True
                
            except Exception as e:
                logger.exception(f"Video processing failed: {video_id}")
                
                if video is None:
                    return False
                
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
    
    async def _generate_audio(self, video: Video) -> tuple[str, str | None]:
        """Generate audio using Edge-TTS with proper rate settings."""
        logger.info(f"Generating audio with voice: {video.voice_type}")
        
        # Get voice settings from video options
        options = video.options or {}
        voice_settings = options.get("voice_settings", {})
        
        # Default: normal speech rate (was -10% but too slow)
        rate = voice_settings.get("rate", "+10%")  # Default 10% faster for better video sync
        volume = voice_settings.get("volume", "+0%")
        pitch = voice_settings.get("pitch", "+0Hz")
        
        logger.info(f"TTS settings - rate: {rate}, volume: {volume}, pitch: {pitch}")
        
        audio_path, subtitle_path = await edge_tts_service.synthesize(
            text=video.script,
            voice=video.voice_type,
            rate=rate,
            volume=volume,
            pitch=pitch,
        )
        
        return audio_path, subtitle_path
    
    async def _download_source_video(self, video: Video) -> str:
        """
        Download source video from YouTube.
        
        Uses yt-dlp to download the video for processing.
        Enhanced with browser impersonation to bypass bot detection.
        """
        logger.info(f"Downloading source video: {video.youtube_id}")
        
        output_path = str(self.temp_dir / f"{video.id}_source.mp4")
        
        # Check for cookies file
        cookies_path = "/app/youtube_cookies.txt"
        has_cookies = Path(cookies_path).exists()
        
        # Use yt-dlp to download video with multiple bypass strategies
        # Try different player clients and impersonation to avoid bot detection
        # Using --impersonate requires curl_cffi package for TLS fingerprint spoofing
        strategies = [
            # Strategy 1: Chrome impersonation with android client
            {
                "client": "android",
                "impersonate": "chrome-131",
            },
            # Strategy 2: Safari impersonation with web_safari client
            {
                "client": "web_safari",
                "impersonate": "safari-18.0",
            },
            # Strategy 3: Android client without impersonation
            {
                "client": "android",
                "impersonate": None,
            },
            # Strategy 4: iOS client
            {
                "client": "ios",
                "impersonate": None,
            },
            # Strategy 5: TV client (often bypasses restrictions)
            {
                "client": "tv",
                "impersonate": None,
            },
            # Strategy 6: TV embedded (for age-restricted)
            {
                "client": "tv_embedded",
                "impersonate": None,
            },
        ]
        
        for idx, strategy in enumerate(strategies):
            # Add delay between retry attempts to avoid rate limiting
            if idx > 0:
                delay = min(2 ** idx, 10)  # Exponential backoff: 2, 4, 8, 10, 10 seconds
                logger.info(f"Waiting {delay}s before retry attempt {idx + 1}")
                await asyncio.sleep(delay)
            
            cmd = [
                "yt-dlp",
                "-f", "best[height<=1080]",
                "-o", output_path,
                "--no-playlist",
                "--no-warnings",
                "--quiet",
                "--extractor-args", f"youtube:player_client={strategy['client']}",
                "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            ]
            
            # Add cookies if available
            if has_cookies:
                cmd.extend(["--cookies", cookies_path])
            
            # Add impersonation if available (requires curl_cffi)
            if strategy.get("impersonate"):
                cmd.extend(["--impersonate", strategy["impersonate"]])
            
            cmd.append(f"https://www.youtube.com/watch?v={video.youtube_id}")
            
            logger.info(f"Trying yt-dlp: client={strategy['client']}, impersonate={strategy.get('impersonate', 'none')}")
            
            try:
                process = await asyncio.wait_for(
                    asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    ),
                    timeout=120  # 2 minute timeout for download
                )
                
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=300  # 5 minute timeout for download completion
                )
            except asyncio.TimeoutError:
                logger.warning(f"Strategy timed out ({strategy['client']})")
                continue
            
            if process.returncode == 0:
                logger.info(f"Successfully downloaded video: client={strategy['client']}, impersonate={strategy.get('impersonate', 'none')}")
                logger.info(f"Downloaded source video to: {output_path}")
                return output_path
            else:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.warning(f"Strategy failed ({strategy['client']}): {error_msg[:200]}")
        
        # All yt-dlp strategies failed, try pytubefix as fallback
        logger.info("yt-dlp failed, trying pytubefix as fallback...")
        try:
            output_path = await self._download_with_pytubefix(video)
            if output_path:
                return output_path
        except Exception as e:
            logger.warning(f"pytubefix also failed: {e}")
        
        # All strategies failed
        raise RuntimeError(f"Failed to download video after trying all strategies. YouTube may be blocking this video.")
    
    async def _download_with_pytubefix(self, video: Video) -> Optional[str]:
        """
        Download video using pytubefix library as fallback.
        pytubefix is a maintained fork of pytube with better YouTube support.
        """
        try:
            from pytubefix import YouTube
        except ImportError:
            logger.warning("pytubefix not installed")
            return None
        
        output_path = str(self.temp_dir / f"{video.id}_source.mp4")
        url = f"https://www.youtube.com/watch?v={video.youtube_id}"
        
        def download_sync():
            """Synchronous download function to run in executor"""
            yt = YouTube(url)
            # Get progressive stream (video + audio)
            stream = yt.streams.filter(
                progressive=True,
                file_extension='mp4'
            ).order_by('resolution').desc().first()
            
            if not stream:
                # Fallback to any available stream
                stream = yt.streams.filter(file_extension='mp4').first()
            
            if stream:
                stream.download(
                    output_path=str(self.temp_dir),
                    filename=f"{video.id}_source.mp4"
                )
                return output_path
            return None
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, download_sync)
        
        if result and Path(result).exists():
            logger.info(f"Successfully downloaded with pytubefix: {result}")
            return result
        
        return None
    
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
    
    def _cleanup_temp_files(self, paths: list[str | None]):
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
