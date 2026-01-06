"""
Edge-TTS Service - FREE Microsoft Neural Text-to-Speech

This service uses edge-tts library to generate high-quality speech
using Microsoft's Neural TTS voices, completely FREE.

Supported voices:
- my-MM-NilarNeural (Burmese Female)
- my-MM-ThihaNeural (Burmese Male)
- en-US-JennyNeural (English Female)
- en-US-GuyNeural (English Male)
- And 300+ more voices in 45+ languages
"""
import asyncio
import os
from pathlib import Path
from typing import Optional
import uuid

import edge_tts
from loguru import logger

from app.core.config import settings


class EdgeTTSService:
    """Edge-TTS service for text-to-speech conversion."""
    
    # Voice mapping by language
    VOICES = {
        "my": {
            "female": "my-MM-NilarNeural",
            "male": "my-MM-ThihaNeural",
        },
        "en": {
            "female": "en-US-JennyNeural",
            "male": "en-US-GuyNeural",
        },
        "th": {
            "female": "th-TH-PremwadeeNeural",
            "male": "th-TH-NiwatNeural",
        },
        "zh": {
            "female": "zh-CN-XiaoxiaoNeural",
            "male": "zh-CN-YunxiNeural",
        },
    }
    
    def __init__(self):
        """Initialize Edge-TTS service."""
        self.temp_dir = Path(settings.TEMP_FILES_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    async def list_voices(cls, language: Optional[str] = None) -> list[dict]:
        """
        List available voices.
        
        Args:
            language: Optional language code to filter voices (e.g., "my", "en")
        
        Returns:
            List of available voices with metadata
        """
        voices = await edge_tts.list_voices()
        
        if language:
            # Filter by language code (e.g., "my" -> "my-MM")
            voices = [v for v in voices if v["Locale"].startswith(language)]
        
        return voices
    
    async def synthesize(
        self,
        text: str,
        voice: str = None,
        language: str = "my",
        gender: str = "female",
        rate: str = "+0%",
        volume: str = "+0%",
        pitch: str = "+0Hz",
    ) -> tuple[str, Optional[str]]:
        """
        Synthesize speech from text.
        
        Args:
            text: Text to convert to speech
            voice: Specific voice name (optional, overrides language/gender)
            language: Language code (my, en, th, zh)
            gender: Voice gender (female, male)
            rate: Speech rate adjustment (e.g., "+10%", "-10%")
            volume: Volume adjustment (e.g., "+10%", "-10%")
            pitch: Pitch adjustment (e.g., "+10Hz", "-10Hz")
        
        Returns:
            Tuple of (audio_file_path, subtitle_file_path)
        """
        # Select voice
        if not voice:
            lang_voices = self.VOICES.get(language, self.VOICES["en"])
            voice = lang_voices.get(gender, lang_voices["female"])
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        audio_path = self.temp_dir / f"{file_id}.mp3"
        subtitle_path = self.temp_dir / f"{file_id}.vtt"
        
        logger.info(f"Synthesizing speech with voice: {voice}")
        logger.debug(f"Text length: {len(text)} characters")
        
        try:
            # Create communicate object
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                volume=volume,
                pitch=pitch,
            )
            
            # Generate audio with subtitles
            submaker = edge_tts.SubMaker()
            
            with open(audio_path, "wb") as audio_file:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_file.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        submaker.feed(chunk)
            
            # Save subtitles
            with open(subtitle_path, "w", encoding="utf-8") as sub_file:
                sub_file.write(submaker.generate_subs())
            
            logger.info(f"Speech synthesized successfully: {audio_path}")
            
            return str(audio_path), str(subtitle_path)
            
        except Exception as e:
            logger.error(f"Edge-TTS synthesis failed: {e}")
            # Cleanup on failure
            if audio_path.exists():
                audio_path.unlink()
            if subtitle_path.exists():
                subtitle_path.unlink()
            raise
    
    async def synthesize_simple(
        self,
        text: str,
        voice: str = None,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Simple synthesis without subtitles.
        
        Args:
            text: Text to convert to speech
            voice: Voice name
            output_path: Optional output file path
        
        Returns:
            Path to generated audio file
        """
        voice = voice or settings.EDGE_TTS_VOICE_DEFAULT
        
        if not output_path:
            file_id = str(uuid.uuid4())
            output_path = str(self.temp_dir / f"{file_id}.mp3")
        
        try:
            communicate = edge_tts.Communicate(text=text, voice=voice)
            await communicate.save(output_path)
            
            logger.info(f"Speech synthesized: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Edge-TTS synthesis failed: {e}")
            raise
    
    def cleanup_file(self, file_path: str) -> None:
        """Remove temporary file."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.debug(f"Cleaned up: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {file_path}: {e}")


# Singleton instance
edge_tts_service = EdgeTTSService()
