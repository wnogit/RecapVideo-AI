"""
Poe API Service - FREE Claude Access via Poe

Poe provides free access to Claude, GPT-4, and other AI models.
This service uses the poe-api-wrapper library.

Setup:
1. Get your Poe API key from https://poe.com/api_key
2. Add to Admin Panel > API Keys > Add New > Type: poe

Usage priority:
1. Poe (Claude) - FREE, high quality
2. Groq (Llama) - FREE fallback
3. Gemini - FREE fallback
"""
import asyncio
from typing import Optional
from loguru import logger

from app.services.api_key_service import api_key_service


class PoeService:
    """Service for generating content using Poe API (FREE Claude access)."""
    
    # Default models available on Poe
    MODELS = {
        "claude": "Claude-3.5-Sonnet",      # Best for quality
        "claude_haiku": "Claude-3-Haiku",   # Faster, still good
        "gpt4": "GPT-4",                     # Alternative
        "gpt4_mini": "GPT-4o-Mini",          # Faster GPT
        "llama": "Llama-3.1-405B",           # Open source
    }
    
    DEFAULT_MODEL = "Claude-3.5-Sonnet"  # Best quality, FREE on Poe
    
    def __init__(self):
        self._client = None
        self._api_key = None
    
    async def _get_client(self):
        """Get Poe API client with lazy initialization."""
        api_key = await api_key_service.get_poe_key()
        
        if not api_key:
            logger.warning("Poe API key not configured")
            return None
        
        # Check if we need to reinitialize
        if self._client and self._api_key == api_key:
            return self._client
        
        try:
            from poe_api_wrapper import AsyncPoeApi
            
            self._api_key = api_key
            self._client = await AsyncPoeApi(tokens={"p-b": api_key}).create()
            logger.info("Poe API client initialized successfully")
            return self._client
            
        except ImportError:
            logger.error("poe-api-wrapper not installed. Run: pip install poe-api-wrapper")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Poe client: {e}")
            return None
    
    async def generate_script(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = None,
        max_retries: int = 2,
    ) -> Optional[str]:
        """
        Generate script using Poe API (Claude).
        
        Args:
            prompt: User prompt with transcript
            system_prompt: System instructions
            model: Model to use (default: Claude-3.5-Sonnet)
            max_retries: Number of retry attempts
            
        Returns:
            Generated script text or None if failed
        """
        client = await self._get_client()
        if not client:
            return None
        
        model_name = model or self.DEFAULT_MODEL
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Generating script with Poe ({model_name}), attempt {attempt + 1}")
                
                response_text = ""
                async for chunk in client.send_message(
                    bot=model_name,
                    message=full_prompt,
                ):
                    response_text += chunk.get("response", "")
                
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
        model: str = None,
    ) -> Optional[str]:
        """
        Simple chat with Poe.
        
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
            response_text = ""
            async for chunk in client.send_message(
                bot=model_name,
                message=message,
            ):
                response_text += chunk.get("response", "")
            
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
