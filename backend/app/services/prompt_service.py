"""
Prompt Service - Fetches prompts from database for AI generation

This service loads custom prompts from the database to customize
script generation, translation, and TTS optimization.
"""
from typing import Optional
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.prompt import Prompt


class PromptService:
    """Service for loading prompts from database."""
    
    # Default fallback prompts
    DEFAULT_PROMPTS = {
        "script_burmese_casual": """Gen-Z နှင့် လူငယ်ပရိသတ်အတွက် ပြောဆိုသလို style ဖြင့် video script ရေးပါ။

Original Transcript:
---
{transcript}
---

Style Guidelines:
- ပြောဆိုသလို tone သုံးပါ (informal)
- "တို့", "ကွာ", "ဟယ်", "ပေါ့" စသည့် casual words သုံးပါ
- Short sentences (TTS အတွက် သင့်တော်အောင်)
- Video length: 60-90 seconds speaking time

Output the script ONLY in Burmese.""",

        "script_default": """You are an expert video content creator. Create a compelling recap script.

Original Transcript:
---
{transcript}
---

Guidelines:
1. Keep it concise (60-90 seconds speaking time)
2. Use short sentences for TTS
3. Natural conversational tone
4. Write in {language}

Output the script ONLY.""",
    }
    
    async def get_prompt(self, key: str, **variables) -> Optional[str]:
        """
        Get a prompt by key from database with variable substitution.
        
        Args:
            key: Prompt key (e.g., "script_burmese_casual")
            **variables: Variables to substitute in the prompt (e.g., transcript=..., language=...)
        
        Returns:
            Formatted prompt string or None if not found
        """
        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    select(Prompt).where(
                        Prompt.key == key,
                        Prompt.is_active == True
                    )
                )
                prompt = result.scalar_one_or_none()
                
                if prompt:
                    content = prompt.content
                    # Substitute variables
                    for var_name, var_value in variables.items():
                        content = content.replace(f"{{{var_name}}}", str(var_value))
                    logger.debug(f"Loaded prompt from DB: {key}")
                    return content
                    
        except Exception as e:
            logger.warning(f"Failed to load prompt from DB: {e}")
        
        # Fallback to default prompts
        if key in self.DEFAULT_PROMPTS:
            content = self.DEFAULT_PROMPTS[key]
            for var_name, var_value in variables.items():
                content = content.replace(f"{{{var_name}}}", str(var_value))
            logger.debug(f"Using default prompt: {key}")
            return content
        
        return None
    
    async def get_active_script_prompt(self, language: str = "my") -> tuple[str, str]:
        """
        Get the currently active script generation prompt.
        
        Args:
            language: Target language code
        
        Returns:
            Tuple of (prompt_key, prompt_content)
        """
        # Priority order for script prompts by language
        prompt_keys = []
        if language == "my":
            prompt_keys = ["script_burmese_casual", "script_burmese_recap", "script_burmese_formal"]
        else:
            prompt_keys = ["script_default"]
        
        try:
            async with async_session_maker() as db:
                # Find first active prompt
                for key in prompt_keys:
                    result = await db.execute(
                        select(Prompt).where(
                            Prompt.key == key,
                            Prompt.is_active == True
                        )
                    )
                    prompt = result.scalar_one_or_none()
                    if prompt:
                        return (key, prompt.content)
        except Exception as e:
            logger.warning(f"Failed to get active script prompt: {e}")
        
        # Return default
        default_key = "script_burmese_casual" if language == "my" else "script_default"
        return (default_key, self.DEFAULT_PROMPTS.get(default_key, ""))


# Singleton instance
prompt_service = PromptService()
