"""
Voice Samples API Endpoints
Provides voice samples for preview in the UI
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import os

router = APIRouter()

# Voice data
class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str
    style: str
    provider: str
    sample_url: str
    is_popular: bool = False
    is_premium: bool = False


# Available voices (Microsoft Edge TTS)
AVAILABLE_VOICES = [
    VoiceInfo(
        id="my-MM-NilarNeural",
        name="Nilar",
        gender="female",
        style="Natural, Clear",
        provider="edge",
        sample_url="/api/v1/voices/sample/nilar",
        is_popular=True,
    ),
    VoiceInfo(
        id="my-MM-ThihaNeural",
        name="Thiha",
        gender="male",
        style="Deep, Professional",
        provider="edge",
        sample_url="/api/v1/voices/sample/thiha",
    ),
]


@router.get("/", response_model=List[VoiceInfo])
async def list_voices(
    gender: Optional[str] = None,
    provider: Optional[str] = None,
):
    """
    List all available voices with optional filtering.
    """
    voices = AVAILABLE_VOICES
    
    if gender:
        voices = [v for v in voices if v.gender == gender]
    
    if provider:
        voices = [v for v in voices if v.provider == provider]
    
    return voices


@router.get("/sample/{voice_name}")
async def get_voice_sample(voice_name: str):
    """
    Get a voice sample audio file.
    Returns a pre-generated 3-second audio sample.
    """
    # Map voice names to sample files
    voice_samples = {
        "nilar": "nilar-sample.mp3",
        "thiha": "thiha-sample.mp3",
    }
    
    if voice_name.lower() not in voice_samples:
        raise HTTPException(status_code=404, detail="Voice sample not found")
    
    sample_path = Path("static/voice-samples") / voice_samples[voice_name.lower()]
    
    if not sample_path.exists():
        # If sample doesn't exist, generate it on-the-fly
        # For now, return 404
        raise HTTPException(
            status_code=404, 
            detail="Voice sample file not found. Please generate samples first."
        )
    
    return FileResponse(
        sample_path,
        media_type="audio/mpeg",
        filename=f"{voice_name}-sample.mp3"
    )


@router.post("/generate-samples")
async def generate_voice_samples():
    """
    Generate voice samples for all available voices.
    This should be called once to create the sample files.
    Admin only endpoint.
    """
    import edge_tts
    import asyncio
    
    sample_text = "မင်္ဂလာပါ၊ ဒီ Video မှာ အရေးကြီးတဲ့ အချက်တွေကို ပြောပြပေးမယ်"
    samples_dir = Path("static/voice-samples")
    samples_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    
    for voice in AVAILABLE_VOICES:
        try:
            output_path = samples_dir / f"{voice.name.lower()}-sample.mp3"
            
            communicate = edge_tts.Communicate(sample_text, voice.id)
            await communicate.save(str(output_path))
            
            results.append({
                "voice": voice.name,
                "status": "success",
                "path": str(output_path)
            })
        except Exception as e:
            results.append({
                "voice": voice.name,
                "status": "error",
                "error": str(e)
            })
    
    return {"results": results}
