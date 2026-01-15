import asyncio
import json
from app.core.database import async_session_maker
from sqlalchemy import select
from app.models.video import Video
from datetime import datetime, timezone

async def check():
    async with async_session_maker() as db:
        r = await db.execute(select(Video).order_by(Video.created_at.desc()).limit(3))
        videos = r.scalars().all()
        now = datetime.now(timezone.utc)
        for v in videos:
            created = v.created_at.replace(tzinfo=timezone.utc) if v.created_at.tzinfo is None else v.created_at
            age = (now - created).total_seconds() / 60  # minutes ago
            print(f"=== Video: {v.id} ===")
            print(f"Created: {age:.1f} minutes ago")
            print(f"Status: {v.status}")
            print(f"Video URL: {v.video_url[:80] if v.video_url else 'N/A'}...")
            print("")

asyncio.run(check())
