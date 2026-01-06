# RecapVideo.AI v3

AI-powered YouTube video recap generator with Burmese language support.

## 🚀 Features

- **YouTube Transcript Extraction**: Uses TranscriptAPI.com for reliable transcript extraction
- **AI Script Generation**: Google Gemini generates engaging recap scripts
- **Text-to-Speech**: FREE Edge-TTS with Burmese neural voices
- **Cloud Storage**: Cloudflare R2 for video/audio hosting
- **Modern Stack**: Next.js 14 + FastAPI + PostgreSQL
- **Google OAuth**: Secure authentication with Google Sign-In only
- **Anti-Abuse Protection**: VPN/Proxy detection, device fingerprinting, IP rate limiting

## 📁 Project Structure

```
recapvideo-v3/
├── frontend/                 # Next.js 14 application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities and API client
│   └── public/               # Static assets
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, database, security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic services
│   │   └── processing/      # Video processing pipeline
│   └── alembic/             # Database migrations
├── docker/                   # Dockerfiles
├── docker-compose.yml        # Single VPS deployment
└── docker-compose.workers.yml # Worker scaling config
```

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query + Zustand

### Backend
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL 15
- Redis (caching & queue)

### Services
- **TTS**: Edge-TTS (FREE Microsoft Neural voices)
  - Burmese: `my-MM-NilarNeural` (female), `my-MM-ThihaNeural` (male)
  - 300+ voices in 45+ languages
- **Transcript**: TranscriptAPI.com
- **AI**: Google Gemini Pro
- **Storage**: Cloudflare R2
- **Email**: Resend
- **Auth**: Google OAuth 2.0
- **Anti-Abuse**: ip-api.com (VPN detection) + FingerprintJS

## 🚦 Quick Start

### Development

1. **Clone and setup backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

2. **Setup frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
```

3. **Run with Docker:**
```bash
docker-compose up -d postgres redis
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

### Production Deployment

```bash
# Single VPS (Phase 1)
docker-compose up -d

# With workers (Phase 2/3)
docker-compose -f docker-compose.yml -f docker-compose.workers.yml up -d
```

## 🌐 URL Structure

- `recapvideo.ai` - Marketing/landing page
- `studio.recapvideo.ai` - User application
- `api.recapvideo.ai` - Backend API
- `admin.recapvideo.ai` - Admin dashboard
- `videos.recapvideo.ai` - Video CDN (R2)

## 📊 Deployment Phases

### Phase 1: Single VPS (Launch)
- All services on one server
- Good for 0-500 users

### Phase 2: VPS + DB (Growth)
- Separate database server
- Good for 500-2000 users

### Phase 3: VPS + Workers + DB (Scale)
- Celery workers on separate servers
- Good for 2000+ users

## 🔑 Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | Secret for JWT tokens (32+ chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `TRANSCRIPT_API_KEY` | TranscriptAPI.com key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `R2_*` | Cloudflare R2 credentials |
| `RESEND_API_KEY` | Resend email API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## 📝 API Documentation

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## 🎤 Edge-TTS Voices

Available Burmese voices (FREE):
```python
# Female
voice = "my-MM-NilarNeural"

# Male
voice = "my-MM-ThihaNeural"
```

List all voices:
```python
import edge_tts
import asyncio

async def list_voices():
    voices = await edge_tts.list_voices()
    for v in voices:
        if v["Locale"].startswith("my"):  # Burmese
            print(v)

asyncio.run(list_voices())
```

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Author

RecapVideo.AI Team
