import asyncio
import json
from app.core.database import async_session_maker
from sqlalchemy import select
from app.models.video import Video

async def check():
    async with async_session_maker() as db:
        r = await db.execute(select(Video).order_by(Video.created_at.desc()).limit(3))
        videos = r.scalars().all()
        for v in videos:
            print(f"=== Video: {v.id} ===")
            print(f"Status: {v.status}")
            print(f"Error: {v.error_message}")
            print(f"Progress: {v.progress_percent}%")
            print(f"Subtitle enabled: {v.options.get('subtitles', {}).get('enabled') if v.options else 'N/A'}")
            print(f"Blur enabled: {v.options.get('blur', {}).get('enabled') if v.options else 'N/A'}")
            print(f"Outro enabled: {v.options.get('outro', {}).get('enabled') if v.options else 'N/A'}")
            print("")

asyncio.run(check())
