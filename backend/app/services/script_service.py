"""
Script Generation Service - Using DeepInfra (Gemini 2.5 Flash) as PRIMARY

Generates recap/summary scripts from YouTube transcripts.
Uses custom prompts from database (Admin configurable).

Priority:
1. DeepInfra (Gemini 2.5 Flash) - PRIMARY, best for Burmese
2. Poe API (Claude 3.5 Sonnet) - FREE backup
3. OpenRouter (Gemini 2.5 Flash) - backup
4. Gemini Direct - Final fallback
"""
import re
from typing import Optional
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service
from app.services.prompt_service import prompt_service
from app.services.poe_service import poe_service


def strip_thinking_block(text: str) -> str:
    """
    Remove <think>...</think> block from AI response.
    
    Gemini 2.5 Flash (thinking model) includes reasoning in <think> tags.
    We need to strip this and only keep the actual script.
    """
    if not text:
        return text
    
    # Remove <think>...</think> block (including multiline)
    result = re.sub(r'<think>.*?</think>\s*', '', text, flags=re.DOTALL)
    
    # Also remove any leading/trailing whitespace
    result = result.strip()
    
    return result


def convert_burmese_formal_to_casual(text: str) -> str:
    """
    Convert formal Burmese writing style to casual/spoken style.
    
    Conversions:
    - ပါသည် → ပါတယ် (polite formal → polite casual)
    - သည် → တယ် (formal → casual)
    - ရမည် → ရမယ် (will have to → casual)
    - မည် → မယ် (will → casual)
    - ၏ → ရဲ့ (possessive formal → casual)
    - နှင့် → နဲ့ (and/with formal → casual)
    - သို့ → ကို (to formal → casual)
    - ခဲ့သည် → ခဲ့တယ် (past tense formal → casual)
    - နိုင်သည် → နိုင်တယ် (can formal → casual)
    - ဖြစ်သည် → ဖြစ်တယ် (is formal → casual)
    """
    if not text:
        return text
    
    # Order matters - replace longer patterns first
    replacements = [
        # Compound endings (must come first)
        (r'ခဲ့ပါသည်', 'ခဲ့ပါတယ်'),
        (r'နေပါသည်', 'နေပါတယ်'),
        (r'မည်ဖြစ်သည်', 'မယ်ဖြစ်တယ်'),
        (r'ပြီးဖြစ်သည်', 'ပြီးဖြစ်တယ်'),
        
        # Common verb endings
        (r'ပါသည်', 'ပါတယ်'),  # Polite formal → polite casual
        (r'ခဲ့သည်', 'ခဲ့တယ်'),  # Past tense
        (r'နေသည်', 'နေတယ်'),  # Progressive
        (r'နိုင်သည်', 'နိုင်တယ်'),  # Can/able
        (r'ဖြစ်သည်', 'ဖြစ်တယ်'),  # Is/are
        (r'ရှိသည်', 'ရှိတယ်'),  # Have/exist
        (r'လာသည်', 'လာတယ်'),  # Come
        (r'သွားသည်', 'သွားတယ်'),  # Go
        (r'လုပ်သည်', 'လုပ်တယ်'),  # Do
        (r'ပြောသည်', 'ပြောတယ်'),  # Say
        (r'မြင်သည်', 'မြင်တယ်'),  # See
        (r'ကြားသည်', 'ကြားတယ်'),  # Hear
        (r'စားသည်', 'စားတယ်'),  # Eat
        (r'သောက်သည်', 'သောက်တယ်'),  # Drink
        (r'ယူသည်', 'ယူတယ်'),  # Take
        (r'ပေးသည်', 'ပေးတယ်'),  # Give
        (r'ဝယ်သည်', 'ဝယ်တယ်'),  # Buy
        (r'ရောင်းသည်', 'ရောင်းတယ်'),  # Sell
        
        # Future/potential
        (r'ရမည်', 'ရမယ်'),  # Will have to
        (r'မည်', 'မယ်'),  # Will (be careful - this is short)
        
        # Particles
        (r'၏', 'ရဲ့'),  # Possessive (formal → casual)
        (r'နှင့်', 'နဲ့'),  # And/with
        (r'သို့', 'ကို'),  # To (direction) - be careful with context
        
        # General သည် → တယ် (last, as fallback)
        (r'သည်။', 'တယ်။'),  # End of sentence
        (r'သည်$', 'တယ်'),  # End of text
    ]
    
    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)
    
    return result


class ScriptService:
    """Service for generating recap scripts using Groq or Gemini."""
    
    # Improved system prompt for high-quality scripts
    DEFAULT_SYSTEM_PROMPT = """You are an expert video scriptwriter specializing in engaging, viral content.
Create a compelling, story-driven recap script from the transcript.

## CRITICAL GUIDELINES:

### 1. LENGTH & FULL COVERAGE (MOST IMPORTANT!)
- MUST cover the ENTIRE story from beginning to END
- Script length should match video length (3-4 minutes = 500-700 words)
- Do NOT cut off mid-story or leave ending incomplete
- Include EVERY major plot point, twist, and conclusion
- If the story has an ending, YOU MUST include it

### 2. SENTENCE STRUCTURE (FOR TTS)
- Use SHORT sentences: 8-15 words maximum per sentence
- Break complex ideas into multiple simple sentences
- Each sentence = one breath for TTS
- Avoid parentheses, dashes, or semicolons

### 3. STORYTELLING
- Start with a HOOK that grabs attention
- Build curiosity and tension throughout
- Use conversational, friendly tone
- ALWAYS end with the story's actual conclusion

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

IMPORTANT: The script MUST tell the COMPLETE story with its ending. Never stop in the middle.
Output the script ONLY - no titles, no metadata, no commentary."""

    def __init__(self):
        """Initialize script generation service."""
        self._groq_client = None
        self._gemini_client = None
        self._openrouter_client = None
        self._deepinfra_client = None
    
    async def _get_deepinfra_key(self):
        """Get DeepInfra API key from database."""
        api_key = await api_key_service.get_deepinfra_key()
        return api_key
    
    async def _call_deepinfra(self, api_key: str, messages: list, model: str = "google/gemini-2.5-flash", max_tokens: int = 4000) -> str:
        """Call DeepInfra API (OpenAI-compatible)."""
        import httpx
        
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                "https://api.deepinfra.com/v1/openai/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    
    async def _get_openrouter_client(self):
        """Lazy-load OpenRouter client with API key from database."""
        import httpx
        
        api_key = await api_key_service.get_openrouter_key()
        if not api_key:
            return None
        
        return api_key  # Return just the key, we'll use httpx directly
    
    async def _call_openrouter(self, api_key: str, messages: list, model: str = "deepseek/deepseek-chat", max_tokens: int = 4000) -> str:
        """Call OpenRouter API directly."""
        import httpx
        
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://recapvideo.com",
                    "X-Title": "RecapVideo AI",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    
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
            # PRIMARY: DeepInfra (Gemini 2.5 Flash) - Best for Burmese
            deepinfra_key = await self._get_deepinfra_key()
            if deepinfra_key:
                logger.info("Using DeepInfra (Gemini 2.5 Flash) for script generation - PRIMARY")
                import asyncio
                try:
                    script = await asyncio.wait_for(
                        self._call_deepinfra(
                            api_key=deepinfra_key,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ],
                            model="google/gemini-2.5-flash",
                            max_tokens=4000,
                        ),
                        timeout=180.0
                    )
                    # Strip <think> block from Gemini 2.5 Flash thinking model
                    script = strip_thinking_block(script)
                    logger.info(f"Stripped thinking block, script length: {len(script)} chars")
                    # Apply formal to casual conversion for Burmese
                    if target_language == "my":
                        script = convert_burmese_formal_to_casual(script)
                        logger.info("Applied Burmese formal-to-casual conversion")
                    logger.info(f"Script generated successfully with DeepInfra: {len(script)} chars")
                    return script
                except Exception as e:
                    logger.warning(f"DeepInfra failed: {e}, trying fallback...")
            
            # Fallback 1: Poe (FREE Claude access)
            if await poe_service.is_available():
                logger.info("Using Poe (Claude 3.5 Sonnet) for script generation - fallback")
                script = await poe_service.generate_script(
                    prompt=prompt,
                    system_prompt=system_prompt,
                )
                if script:
                    # Apply formal to casual conversion for Burmese
                    if target_language == "my":
                        script = convert_burmese_formal_to_casual(script)
                        logger.info("Applied Burmese formal-to-casual conversion")
                    logger.info(f"Script generated successfully with Poe: {len(script)} chars")
                    return script
                logger.warning("Poe generation returned empty, trying fallback...")
            
            # Fallback 2: OpenRouter with Gemini 2.5 Flash
            openrouter_key = await self._get_openrouter_client()
            if openrouter_key:
                logger.info("Using OpenRouter (Gemini 2.5 Flash) for script generation - fallback")
                import asyncio
                try:
                    script = await asyncio.wait_for(
                        self._call_openrouter(
                            api_key=openrouter_key,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ],
                            model="google/gemini-2.5-flash",
                            max_tokens=4000,
                        ),
                        timeout=120.0
                    )
                    # Apply formal to casual conversion for Burmese
                    if target_language == "my":
                        script = convert_burmese_formal_to_casual(script)
                        logger.info("Applied Burmese formal-to-casual conversion")
                    logger.info(f"Script generated successfully with OpenRouter: {len(script)} chars")
                    return script
                except Exception as e:
                    logger.warning(f"OpenRouter failed: {e}, trying next fallback...")
            
            # Final fallback to Gemini Direct
            gemini_client = await self._get_gemini_client()
            if gemini_client:
                logger.info("Using Gemini Direct for script generation - final fallback")
                import asyncio
                response = await asyncio.wait_for(
                    gemini_client.generate_content_async(prompt),
                    timeout=60.0  # 60 second timeout
                )
                script = response.text.strip()
                # Apply formal to casual conversion for Burmese
                if target_language == "my":
                    script = convert_burmese_formal_to_casual(script)
                    logger.info("Applied Burmese formal-to-casual conversion")
                logger.info(f"Script generated successfully with Gemini Direct: {len(script)} chars")
                return script
            
            raise ValueError("No AI API key configured (DeepInfra, Poe, OpenRouter, or Gemini)")
            
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
            # Try Poe first (FREE Claude)
            if await poe_service.is_available():
                response = await poe_service.chat(prompt)
                if response:
                    return response
            
            # Fallback to OpenRouter
            openrouter_key = await self._get_openrouter_client()
            if openrouter_key:
                return await self._call_openrouter(
                    api_key=openrouter_key,
                    messages=[{"role": "user", "content": prompt}],
                    model="deepseek/deepseek-chat",
                )
            
            # Fallback to Groq
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
