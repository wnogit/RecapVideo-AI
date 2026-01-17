"""
Poe API Service - Official Poe API (OpenAI SDK Compatible)

Poe provides access to Claude, GPT-4, Gemini, and other AI models.
This service uses the OFFICIAL Poe API with OpenAI SDK compatibility.

Setup:
1. Get your Poe API key from https://poe.com/api_key
2. Add to Admin Panel > API Keys > Add New > Type: poe

Official Docs: https://creator.poe.com/docs/external-applications/external-application-guide

Model Pricing (10k points/day):
- Gemini-2.5-Flash-Lite: ~52 pts/script (BEST VALUE - 192 scripts/day)
- Gemini-2.5-Flash: ~264 pts/script (38 scripts/day)
"""
import asyncio
from typing import Optional
from loguru import logger
import openai

from app.services.api_key_service import api_key_service


class PoeService:
    """Service for generating content using Official Poe API (OpenAI SDK compatible)."""
    
    # Poe API base URL (OpenAI compatible)
    BASE_URL = "https://api.poe.com/v1"
    
    # Default models available on Poe (use lowercase with hyphens)
    MODELS = {
        "claude": "claude-3.5-sonnet",      # Best for quality
        "claude_haiku": "claude-3-haiku",   # Faster, still good
        "gpt4": "gpt-4",                     # Alternative
        "gpt4_mini": "gpt-4o-mini",          # Faster GPT
        "llama": "llama-3.1-405b",           # Open source
        # Gemini models (CHEAPEST!)
        "gemini_flash_lite": "gemini-2.5-flash-lite",  # Best value: 3 pts/1k input, 10 pts/1k output
        "gemini_flash": "gemini-2.5-flash",             # Good: 7 pts/1k input
        "gemini_3_flash": "gemini-3-flash",             # Latest: 14 pts/1k input
    }
    
    DEFAULT_MODEL = "gemini-2.5-flash-lite"  # Cheapest: ~52 points per script
    
    def __init__(self):
        self._client = None
        self._api_key = None
    
    async def _get_client(self) -> Optional[openai.AsyncOpenAI]:
        """Get Poe API client (OpenAI SDK compatible) with lazy initialization."""
        api_key = await api_key_service.get_poe_key()
        
        if not api_key:
            logger.warning("Poe API key not configured")
            return None
        
        # Check if we need to reinitialize
        if self._client and self._api_key == api_key:
            return self._client
        
        try:
            self._api_key = api_key
            self._client = openai.AsyncOpenAI(
                api_key=api_key,
                base_url=self.BASE_URL
            )
            logger.info("Poe API client initialized (OpenAI SDK compatible)")
            return self._client
            
        except Exception as e:
            logger.error(f"Failed to initialize Poe client: {e}")
            return None
    
    async def generate_script(
        self,
        prompt: str,
        system_prompt: str = "",
        model: Optional[str] = None,
        max_retries: int = 2,
    ) -> Optional[str]:
        """
        Generate script using Official Poe API (OpenAI SDK compatible).
        
        Args:
            prompt: User prompt with transcript
            system_prompt: System instructions
            model: Model to use (default: gemini-2.5-flash-lite)
            max_retries: Number of retry attempts
            
        Returns:
            Generated script text or None if failed
        """
        client = await self._get_client()
        if not client:
            return None
        
        model_name = model or self.DEFAULT_MODEL
        
        # Build messages in OpenAI format
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Generating script with Poe Official API ({model_name}), attempt {attempt + 1}")
                
                # Use OpenAI SDK compatible API
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                )
                
                response_text = response.choices[0].message.content
                
                if response_text:
                    logger.info(f"Poe script generation successful: {len(response_text)} chars")
                    return response_text.strip()
                
            except Exception as e:
                logger.warning(f"Poe generation attempt {attempt + 1} failed: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
        
        logger.error("Poe script generation failed after all retries")
        return None
    
    async def chat(
        self,
        message: str,
        model: Optional[str] = None,
    ) -> Optional[str]:
        """
        Simple chat with Poe using Official API.
        
        Args:
            message: Chat message
            model: Model to use
            
        Returns:
            Response text
        """
        client = await self._get_client()
        if not client:
            return None
        
        model_name = model or self.DEFAULT_MODEL
        
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": message}],
            )
            
            response_text = response.choices[0].message.content
            return response_text.strip() if response_text else None
            
        except Exception as e:
            logger.error(f"Poe chat failed: {e}")
            return None
    
    async def is_available(self) -> bool:
        """Check if Poe API is available and configured."""
        api_key = await api_key_service.get_poe_key()
        return bool(api_key)
    
    def get_available_models(self) -> dict:
        """Get list of available models."""
        return self.MODELS.copy()


# Singleton instance
poe_service = PoeService()
