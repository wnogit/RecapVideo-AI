"""Check video subtitle settings."""
import sys
sys.path.insert(0, '/app')

from app.database import SessionLocal
from app.models import Video

db = SessionLocal()
v = db.query(Video).order_by(Video.created_at.desc()).first()

print("=== Latest Video ===")
print(f"ID: {v.id}")
print(f"Status: {v.status}")

options = v.options or {}
print("\n=== Subtitle Options ===")
subtitle_opts = options.get("subtitles", {})
print(f"Subtitle enabled: {subtitle_opts.get('enabled', 'NOT SET')}")
print(f"Full subtitle options: {subtitle_opts}")

print("\n=== Outro Options ===")
outro_opts = options.get("outro", {})
print(f"Outro enabled: {outro_opts.get('enabled', 'NOT SET')}")
print(f"Full outro options: {outro_opts}")

db.close()
