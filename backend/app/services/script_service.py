"""
Script Generation Service - Dynamic Priority-based AI Provider Selection

Generates recap/summary scripts from YouTube transcripts.
Uses custom prompts from database (Admin configurable).

Priority is determined by database `priority` field:
- Lower number = higher priority (1 is first)
- Multiple keys per provider = random selection
- Auto-fallback to next provider on failure

Admin can configure via Integrations page:
- Provider priority order
- Model selection per provider
- Multiple API keys per provider (load balancing)
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

### 4. BURMESE WRITING (if မြန်မာ) - SPELLING IS CRITICAL!
- Use CORRECT Burmese spelling and grammar ALWAYS
- Double-check every word for correct spelling (ပေါင်းစပ်)
- Use natural spoken Burmese, not formal
- Common mistakes to avoid:
  * "ဗအ" → "ဘို့" (for "for/to")
  * "တောင်း" → "တောင့်" (context-dependent)
  * "နူမာ" → "နောက်မှာ" or "နောက်ဆုံး" (context-dependent)
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
            # Get AI providers ordered by priority from database
            providers = await api_key_service.get_ai_providers_by_priority()
            
            if not providers:
                raise ValueError("No AI providers configured in database or environment")
            
            # Group providers by priority
            import random
            from itertools import groupby
            
            providers_by_priority = {}
            for provider_info in providers:
                priority = provider_info["priority"]
                if priority not in providers_by_priority:
                    providers_by_priority[priority] = []
                providers_by_priority[priority].append(provider_info)
            
            sorted_priorities = sorted(providers_by_priority.keys())
            logger.info(f"AI Provider priorities: {sorted_priorities}, providers: {[[p['provider'] for p in providers_by_priority[pri]] for pri in sorted_priorities]}")
            
            # Try each priority level, exhausting all keys before moving to next priority
            for priority in sorted_priorities:
                priority_providers = providers_by_priority[priority]
                logger.info(f"Trying priority {priority} providers: {[p['provider'] for p in priority_providers]}")
                
                # Collect all keys from all providers at this priority level
                all_keys_at_priority = []
                for provider_info in priority_providers:
                    provider = provider_info["provider"]
                    keys = provider_info["keys"]
                    default_model = provider_info.get("model")
                    
                    for key in keys:
                        all_keys_at_priority.append({
                            "provider": provider,
                            "key_value": key["key_value"],
                            "model": key.get("model") or default_model,
                        })
                
                # Shuffle keys at this priority level for random distribution
                random.shuffle(all_keys_at_priority)
                
                logger.info(f"Total keys at priority {priority}: {len(all_keys_at_priority)}")
                
                # Try all keys at this priority level
                for key_info in all_keys_at_priority:
                    provider = key_info["provider"]
                    api_key = key_info["key_value"]
                    model = key_info["model"]
                    
                    logger.info(f"Trying {provider} (model: {model}, priority: {priority})")
                    
                    try:
                        script = await self._call_provider(
                            provider=provider,
                            api_key=api_key,
                            model=model,
                            system_prompt=system_prompt,
                            prompt=prompt,
                        )
                        
                        if script:
                            # Strip <think> block from thinking models
                            script = strip_thinking_block(script)
                            
                            # Note: Formal-to-casual conversion disabled - AI prompt already requests casual style
                            # and conversion was causing spelling errors (e.g., "သို့" → "ကို" in wrong contexts)
                            # if target_language == "my":
                            #     script = convert_burmese_formal_to_casual(script)
                            #     logger.info("Applied Burmese formal-to-casual conversion")
                            
                            logger.info(f"Script generated successfully with {provider} (priority {priority}): {len(script)} chars")
                            return script
                            
                    except Exception as e:
                        logger.warning(f"{provider} (priority {priority}) failed: {e}, trying next key...")
                        continue
                
                logger.warning(f"All keys at priority {priority} failed, moving to next priority...")
            
            raise ValueError("All AI providers at all priority levels failed")
            
        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            raise
    
    async def _call_provider(
        self,
        provider: str,
        api_key: str,
        model: str,
        system_prompt: str,
        prompt: str,
    ) -> Optional[str]:
        """Call a specific AI provider."""
        import asyncio
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        if provider == "deepinfra":
            return await asyncio.wait_for(
                self._call_deepinfra(api_key, messages, model or "google/gemini-2.5-flash"),
                timeout=180.0
            )
        
        elif provider == "openrouter":
            return await asyncio.wait_for(
                self._call_openrouter(api_key, messages, model or "google/gemini-2.5-flash"),
                timeout=120.0
            )
        
        elif provider == "groq":
            from groq import AsyncGroq
            client = AsyncGroq(api_key=api_key)
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model or "llama-3.3-70b-versatile",
                    messages=messages,
                    max_tokens=4000,
                ),
                timeout=120.0
            )
            return response.choices[0].message.content.strip()
        
        elif provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(model or 'gemini-2.0-flash')
            response = await asyncio.wait_for(
                gemini_model.generate_content_async(prompt),
                timeout=60.0
            )
            return response.text.strip()
        
        elif provider == "poe":
            if await poe_service.is_available():
                return await poe_service.generate_script(
                    prompt=prompt, 
                    system_prompt=system_prompt,
                    model=model or "Gemini-2.5-Flash-Lite"  # Cheapest: 52 points/script
                )
            return None
        
        return None
    
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
