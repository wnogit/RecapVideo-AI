import asyncio
from app.core.database import async_session_maker
from sqlalchemy import select
from app.models.video import Video

async def check():
    async with async_session_maker() as db:
        r = await db.execute(select(Video).order_by(Video.created_at.desc()).limit(1))
        v = r.scalar_one_or_none()
        if v:
            print(f"Video ID: {v.id}")
            print(f"Status: {v.status}")
            print(f"Video URL: {v.video_url}")
            print(f"Audio URL: {v.audio_url}")
            print(f"Source URL: {v.source_url}")
            print(f"Created: {v.created_at}")
            print(f"Completed: {v.completed_at}")

asyncio.run(check())
