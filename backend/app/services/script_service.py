"""
Script Generation Service - Using Google Gemini

Generates recap/summary scripts from YouTube transcripts.
"""
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class ScriptService:
    """Service for generating recap scripts using Google Gemini."""
    
    SYSTEM_PROMPT = """You are an expert video content creator specializing in creating 
engaging recap and summary videos. Your task is to take a YouTube video transcript and 
create a compelling, informative script for a recap video.

Guidelines:
1. Keep the script concise but comprehensive
2. Maintain the key points and most important information
3. Use engaging language that works well for voiceover
4. Structure the content logically with a clear introduction, main points, and conclusion
5. The script should be suitable for text-to-speech conversion
6. Avoid overly complex sentences that are hard to speak
7. Target length: 2-5 minutes of speaking time (300-750 words)

Output the script ONLY - no additional commentary or formatting."""

    def __init__(self):
        """Initialize script generation service."""
        self._client = None
    
    async def _get_client(self):
        """Lazy-load Gemini client with API key from database."""
        import google.generativeai as genai
        
        api_key = await api_key_service.get_gemini_key()
        if not api_key:
            raise ValueError("Gemini API key not configured")
        
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-pro')
    
    async def generate_script(
        self,
        transcript: str,
        video_title: str = None,
        target_language: str = "my",  # Burmese
        style: str = "informative",
        max_length: int = 750,
    ) -> str:
        """
        Generate a recap script from a transcript.
        
        Args:
            transcript: Original video transcript
            video_title: Video title for context
            target_language: Output language (my=Burmese, en=English)
            style: Script style (informative, casual, professional)
            max_length: Maximum word count
        
        Returns:
            Generated script text
        """
        logger.info(f"Generating script for: {video_title or 'Unknown video'}")
        logger.debug(f"Transcript length: {len(transcript)} chars")
        
        # Build prompt
        language_instruction = ""
        if target_language == "my":
            language_instruction = "Write the script in Burmese (မြန်မာဘာသာ)."
        elif target_language == "th":
            language_instruction = "Write the script in Thai (ภาษาไทย)."
        elif target_language == "zh":
            language_instruction = "Write the script in Chinese (中文)."
        else:
            language_instruction = "Write the script in English."
        
        prompt = f"""
{self.SYSTEM_PROMPT}

Video Title: {video_title or "Unknown"}
Style: {style}
Maximum Words: {max_length}
{language_instruction}

Original Transcript:
---
{transcript[:15000]}  # Limit transcript length
---

Generate the recap script:
"""
        
        try:
            # Get client with API key from database
            client = await self._get_client()
            
            # Call Gemini API
            response = await client.generate_content_async(prompt)
            
            script = response.text.strip()
            
            logger.info(f"Script generated successfully: {len(script)} chars")
            return script
            
        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            raise
    
    async def improve_script(
        self,
        script: str,
        instructions: str,
    ) -> str:
        """
        Improve an existing script based on instructions.
        
        Args:
            script: Existing script to improve
            instructions: User instructions for improvement
        
        Returns:
            Improved script text
        """
        prompt = f"""
You are a script editor. Improve the following script based on the instructions.

Current Script:
---
{script}
---

Instructions: {instructions}

Output the improved script ONLY:
"""client = await self._get_client()
            response = await 
        
        try:
            response = await self.client.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Script improvement failed: {e}")
            raise


# Singleton instance
script_service = ScriptService()
