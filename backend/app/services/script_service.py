"""
Script Generation Service - Using Groq (Llama) with Gemini fallback

Generates recap/summary scripts from YouTube transcripts.
"""
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class ScriptService:
    """Service for generating recap scripts using Groq or Gemini."""
    
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
        self._groq_client = None
        self._gemini_client = None
    
    async def _get_groq_client(self):
        """Lazy-load Groq client with API key from database."""
        from groq import AsyncGroq
        
        api_key = await api_key_service.get_groq_key()
        if not api_key:
            return None
        
        return AsyncGroq(api_key=api_key)
    
    async def _get_gemini_client(self):
        """Lazy-load Gemini client with API key from database (fallback)."""
        import google.generativeai as genai
        
        api_key = await api_key_service.get_gemini_key()
        if not api_key:
            return None
        
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-2.0-flash')
    
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
            # Try Groq first (faster and better free tier)
            groq_client = await self._get_groq_client()
            if groq_client:
                logger.info("Using Groq (Llama 3.3) for script generation")
                response = await groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2000,
                    temperature=0.7,
                )
                script = response.choices[0].message.content.strip()
                logger.info(f"Script generated successfully with Groq: {len(script)} chars")
                return script
            
            # Fallback to Gemini
            gemini_client = await self._get_gemini_client()
            if gemini_client:
                logger.info("Using Gemini for script generation (fallback)")
                response = await gemini_client.generate_content_async(prompt)
                script = response.text.strip()
                logger.info(f"Script generated successfully with Gemini: {len(script)} chars")
                return script
            
            raise ValueError("No AI API key configured (Groq or Gemini)")
            
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
"""
        
        try:
            # Try Groq first
            groq_client = await self._get_groq_client()
            if groq_client:
                response = await groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000,
                )
                return response.choices[0].message.content.strip()
            
            # Fallback to Gemini
            gemini_client = await self._get_gemini_client()
            if gemini_client:
                response = await gemini_client.generate_content_async(prompt)
                return response.text.strip()
            
            raise ValueError("No AI API key configured")
        except Exception as e:
            logger.error(f"Script improvement failed: {e}")
            raise


# Singleton instance
script_service = ScriptService()
