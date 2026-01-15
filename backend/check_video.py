import asyncio
import json
from app.core.database import async_session_maker
from sqlalchemy import select
from app.models.video import Video

async def check():
    async with async_session_maker() as db:
        r = await db.execute(select(Video).order_by(Video.created_at.desc()).limit(1))
        v = r.scalar_one_or_none()
        if v:
            print("Video ID:", v.id)
            print("Status:", v.status)
            print("Voice:", v.voice_type)
            print("Options:")
            print(json.dumps(v.options, indent=2, ensure_ascii=False) if v.options else "None")

asyncio.run(check())
