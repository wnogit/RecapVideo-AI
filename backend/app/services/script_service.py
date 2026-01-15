"""
Script Generation Service - Using Groq (Llama) with Gemini fallback

Generates recap/summary scripts from YouTube transcripts.
Uses custom prompts from database (Admin configurable).
"""
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service
from app.services.prompt_service import prompt_service


class ScriptService:
    """Service for generating recap scripts using Groq or Gemini."""
    
    # Improved system prompt for high-quality scripts
    DEFAULT_SYSTEM_PROMPT = """You are an expert video scriptwriter specializing in engaging, viral content.
Create a compelling, story-driven recap script from the transcript.

## CRITICAL GUIDELINES:

### 1. LENGTH & TIMING
- Script should be 2-3 minutes speaking time (300-500 words)
- Do NOT shorten content unnecessarily
- Include all key points from the original video

### 2. SENTENCE STRUCTURE (FOR TTS)
- Use SHORT sentences: 8-15 words maximum per sentence
- Break complex ideas into multiple simple sentences
- Each sentence = one breath for TTS
- Avoid parentheses, dashes, or semicolons

### 3. STORYTELLING
- Start with a HOOK that grabs attention
- Build curiosity and tension
- Use conversational, friendly tone
- End with a memorable conclusion

### 4. BURMESE WRITING (if မြန်မာ)
- Use natural spoken Burmese, not formal
- Avoid complex compound words
- Use simple punctuation (။ ၊)
- Write numbers as words when possible

### 5. FORMAT
- No bullet points or lists
- No emoji in script
- Pure narration text only
- Natural paragraph breaks

Output the script ONLY - no titles, no metadata, no commentary."""

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
        
        # Try to load prompt from database
        prompt_key, db_prompt = await prompt_service.get_active_script_prompt(target_language)
        logger.info(f"Using prompt: {prompt_key}")
        
        if db_prompt:
            # Use database prompt with variable substitution
            prompt = db_prompt.replace("{transcript}", transcript[:15000])
            prompt = prompt.replace("{video_title}", video_title or "Unknown")
            prompt = prompt.replace("{style}", style)
            prompt = prompt.replace("{max_length}", str(max_length))
            system_prompt = self.DEFAULT_SYSTEM_PROMPT
        else:
            # Fallback to hardcoded prompt
            language_instruction = ""
            if target_language == "my":
                language_instruction = "Write the script in Burmese (မြန်မာဘာသာ). Use SHORT sentences (10-15 words each) for TTS."
            elif target_language == "th":
                language_instruction = "Write the script in Thai (ภาษาไทย)."
            elif target_language == "zh":
                language_instruction = "Write the script in Chinese (中文)."
            else:
                language_instruction = "Write the script in English."
            
            system_prompt = self.DEFAULT_SYSTEM_PROMPT
            prompt = f"""
Video Title: {video_title or "Unknown"}
Style: {style}
Maximum Words: {max_length}
{language_instruction}

Original Transcript:
---
{transcript[:15000]}
---

Generate the recap script (SHORT sentences only, suitable for TTS):
"""
        
        try:
            # Try Groq first (faster and better free tier)
            groq_client = await self._get_groq_client()
            if groq_client:
                logger.info("Using Groq (Llama 3.3) for script generation")
                response = await groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
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
