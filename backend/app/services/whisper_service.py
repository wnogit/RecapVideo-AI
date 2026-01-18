"""
Whisper Service - Audio transcription using HuggingFace Whisper API
For TikTok and Facebook videos that don't have native transcripts
"""
import os
import asyncio
import tempfile
from pathlib import Path
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class WhisperService:
    """Service for transcribing audio using HuggingFace Whisper API."""
    
    def __init__(self):
        """Initialize Whisper service."""
        self.model = "openai/whisper-large-v3"
        self.provider = "fal-ai"
    
    async def _get_api_key(self) -> str:
        """Get HuggingFace API key from database or environment."""
        # Try to get from database first (via api_key_service)
        key = await api_key_service.get_huggingface_key()
        if key:
            return key
        
        # Fallback to environment variable
        env_key = getattr(settings, 'HUGGINGFACE_API_KEY', None) or os.environ.get('HUGGINGFACE_API_KEY')
        if env_key:
            return env_key
            
        raise ValueError("HuggingFace API key not configured. Add it in Admin Panel → Integrations or set HUGGINGFACE_API_KEY in environment.")
    
    async def transcribe(self, audio_path: str) -> str:
        """
        Transcribe audio file using HuggingFace Whisper API.
        
        Args:
            audio_path: Path to audio file (mp3, wav, etc.)
            
        Returns:
            Transcribed text
        """
        logger.info(f"🎤 Starting Whisper transcription for: {audio_path}")
        
        try:
            # Get API key asynchronously first
            api_key = await self._get_api_key()
            
            # Run sync transcription in executor
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: self._transcribe_sync(audio_path, api_key)
            )
            logger.info(f"✅ Whisper transcription completed: {len(result)} characters")
            return result
        except Exception as e:
            logger.error(f"❌ Whisper transcription failed: {e}")
            raise
    
    def _transcribe_sync(self, audio_path: str, api_key: str) -> str:
        """Synchronous transcription (runs in executor)."""
        from huggingface_hub import InferenceClient
        
        client = InferenceClient(
            provider=self.provider,
            api_key=api_key,
        )
        
        # Perform transcription
        output = client.automatic_speech_recognition(
            audio_path,
            model=self.model
        )
        
        # Handle different response formats
        if hasattr(output, 'text'):
            return output.text
        elif isinstance(output, dict) and 'text' in output:
            return output['text']
        elif isinstance(output, str):
            return output
        else:
            logger.warning(f"Unexpected Whisper response type: {type(output)}")
            return str(output) if output else ""
    
    async def extract_audio(self, video_path: str, output_path: Optional[str] = None) -> str:
        """
        Extract audio from video file using ffmpeg.
        
        Args:
            video_path: Path to video file
            output_path: Optional output path for audio file
            
        Returns:
            Path to extracted audio file
        """
        if output_path is None:
            # Create temp file for audio
            temp_dir = Path(tempfile.gettempdir()) / "whisper_audio"
            temp_dir.mkdir(parents=True, exist_ok=True)
            output_path = str(temp_dir / f"{Path(video_path).stem}.wav")
        
        logger.info(f"🎵 Extracting audio from: {video_path}")
        
        # Use WAV format with 16kHz sample rate for Whisper
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vn",  # No video
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",  # Mono
            "-y",  # Overwrite
            output_path
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        
        if proc.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            raise RuntimeError(f"Audio extraction failed: {error_msg}")
        
        logger.info(f"✅ Audio extracted to: {output_path}")
        return output_path
    
    async def transcribe_video(self, video_path: str) -> str:
        """
        Transcribe video by extracting audio and running Whisper.
        
        Args:
            video_path: Path to video file
            
        Returns:
            Transcribed text
        """
        # Extract audio
        audio_path = await self.extract_audio(video_path)
        
        try:
            # Transcribe
            transcript = await self.transcribe(audio_path)
            return transcript
        finally:
            # Cleanup audio file
            try:
                os.remove(audio_path)
            except Exception:
                pass


# Singleton instance
whisper_service = WhisperService()
