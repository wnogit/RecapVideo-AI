"""
Edge-TTS Service - FREE Microsoft Neural Text-to-Speech

This service uses edge-tts library to generate high-quality speech
using Microsoft's Neural TTS voices, completely FREE.
Falls back to gTTS (Google TTS) if Edge-TTS fails.

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
from gtts import gTTS
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
        subtitle_path = self.temp_dir / f"{file_id}.srt"  # Changed to .srt (edge-tts 7.x)
        
        logger.info(f"Synthesizing speech with voice: {voice}")
        logger.debug(f"Text length: {len(text)} characters")
        
        try:
            # Create communicate object with sentence boundary for better subtitles
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                volume=volume,
                pitch=pitch,
            )
            
            # Generate audio with subtitles using WordBoundary
            # Note: edge-tts only emits WordBoundary events, not SentenceBoundary
            submaker = edge_tts.SubMaker()
            
            with open(audio_path, "wb") as audio_file:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_file.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        # WordBoundary provides timing for each word - required for sync
                        submaker.feed(chunk)
            
            # Get SRT content from submaker
            srt_content = submaker.get_srt()
            
            # Check if SRT is empty (common for Burmese/non-space-delimited languages)
            if not srt_content or len(srt_content.strip()) < 10:
                logger.warning("Edge-TTS SubMaker returned empty SRT. Using sentence-based fallback for Burmese.")
                srt_content = self._generate_sentence_based_srt(text, audio_path)
            
            # Save subtitles
            with open(subtitle_path, "w", encoding="utf-8") as sub_file:
                sub_file.write(srt_content)
            
            logger.info(f"Speech synthesized successfully: {audio_path}")
            logger.info(f"Subtitle file size: {len(srt_content)} bytes")
            
            return str(audio_path), str(subtitle_path)
            
        except Exception as e:
            logger.error(f"Edge-TTS synthesis failed: {e}")
            logger.info("Falling back to gTTS (Google Text-to-Speech)")
            
            # Fallback to gTTS
            try:
                # Map language code for gTTS
                gtts_lang = language if language in ["en", "th", "zh-CN"] else "en"
                if language == "my":
                    # gTTS doesn't support Burmese, use English
                    gtts_lang = "en"
                elif language == "zh":
                    gtts_lang = "zh-CN"
                
                tts = gTTS(text=text, lang=gtts_lang, slow=False)
                tts.save(str(audio_path))
                
                logger.info(f"gTTS fallback successful: {audio_path}")
                
                # gTTS doesn't generate subtitles, return None for subtitle_path
                return str(audio_path), None
                
            except Exception as gtts_error:
                logger.error(f"gTTS fallback also failed: {gtts_error}")
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
    
    def _generate_sentence_based_srt(self, text: str, audio_path: Path) -> str:
        """
        Generate SRT subtitles by splitting text into sentences.
        Used as fallback for Burmese/non-space-delimited languages.
        
        Args:
            text: Full text content
            audio_path: Path to audio file to get duration
            
        Returns:
            SRT format string
        """
        import re
        import subprocess
        
        # Get audio duration using ffprobe
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
                capture_output=True, text=True, timeout=10
            )
            total_duration = float(result.stdout.strip())
        except Exception as e:
            logger.warning(f"Failed to get audio duration: {e}. Using estimated duration.")
            # Estimate: ~2.5 chars per second for Burmese TTS
            total_duration = len(text) / 2.5
        
        # Split by Burmese sentence-ending punctuation (။) or comma (၊)
        # Also split by regular periods and newlines
        sentences = re.split(r'[။၊\.\n]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return ""
        
        # Calculate time per sentence
        time_per_sentence = total_duration / len(sentences)
        
        # Generate SRT
        srt_lines = []
        for i, sentence in enumerate(sentences):
            start_time = i * time_per_sentence
            end_time = (i + 1) * time_per_sentence
            
            # Format time as SRT: HH:MM:SS,mmm
            start_str = self._format_srt_time(start_time)
            end_str = self._format_srt_time(end_time)
            
            srt_lines.append(f"{i + 1}")
            srt_lines.append(f"{start_str} --> {end_str}")
            srt_lines.append(sentence)
            srt_lines.append("")  # Blank line between entries
        
        logger.info(f"Generated {len(sentences)} subtitle segments from {total_duration:.1f}s audio")
        return "\n".join(srt_lines)
    
    def _format_srt_time(self, seconds: float) -> str:
        """Format seconds as SRT timestamp: HH:MM:SS,mmm"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"
    
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
