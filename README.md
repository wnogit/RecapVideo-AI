# RecapVideo.AI v3

> AI-powered YouTube video recap generator with Burmese language support.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com/)

## 🎯 Overview

RecapVideo.AI transforms YouTube videos into engaging short-form recap videos with **Burmese voiceover**. Users paste a YouTube URL, and the system automatically:

1. **Extracts** the transcript from YouTube
2. **Translates** to Burmese using AI (Google Gemini)
3. **Generates** voiceover using Edge-TTS (FREE)
4. **Creates** a downloadable video with audio

### Target Market
- 🇲🇲 Myanmar users who want YouTube content in Burmese
- Content creators making recap/summary videos
- Educational content localization

### Business Model
- **Credit-based system**: Users buy credits to create videos
- **Trial credits**: 4 free credits for new users
- **Manual payment approval**: Admin approves orders via Telegram

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RECAPVIDEO.AI v3                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │  Frontend   │────▶│   Backend   │────▶│   PostgreSQL    │   │
│  │  Next.js 14 │     │   FastAPI   │     │   + Redis       │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    EXTERNAL SERVICES                       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  • TranscriptAPI.com  - YouTube transcript extraction      │  │
│  │  • Google Gemini      - AI translation & script gen        │  │
│  │  • Edge-TTS (FREE)    - Burmese text-to-speech             │  │
│  │  • Cloudflare R2      - Video/audio storage                │  │
│  │  • Resend             - Email notifications                │  │
│  │  • Telegram Bot       - Order notifications                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 | React framework (App Router) |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | UI components |
| Zustand | 4.x | State management |
| React Query | 5.x | Server state |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.109 | Python web framework |
| SQLAlchemy | 2.0 | Async ORM |
| PostgreSQL | 15 | Database |
| Redis | 7 | Caching & queue |
| Celery | 5.3 | Background tasks |

### Services
| Service | Purpose | Cost |
|---------|---------|------|
| Edge-TTS | Text-to-Speech | FREE |
| TranscriptAPI.com | Transcript extraction | Paid |
| Google Gemini | AI translation | Paid |
| Cloudflare R2 | Storage | Paid |
| Resend | Email | Paid |

---

## 📁 Project Structure

```
recapvideo-v3/
├── frontend/                 # Next.js 14 application
│   ├── app/                  # App router pages
│   │   ├── (admin)/         # Admin dashboard routes
│   │   ├── (auth)/          # Auth pages
│   │   ├── (dashboard)/     # User dashboard routes
│   │   └── (marketing)/     # Landing pages
│   ├── components/           # React components
│   │   ├── admin/           # Admin components
│   │   ├── auth/            # Auth components
│   │   ├── layout/          # Layout components
│   │   ├── ui/              # shadcn/ui components
│   │   └── video/           # Video creation components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and API client
│   └── stores/              # Zustand stores
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
├── docs/                     # Documentation
└── docker-compose.yml        # Production deployment
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- FFmpeg

### Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/wnogit/RecapVideo-AI.git
cd RecapVideo-AI/recapvideo-v3
```

2. **Setup Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

3. **Setup Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
```

4. **Run with Docker:**
```bash
docker-compose up -d postgres redis
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

### Production Deployment

```bash
docker-compose up -d
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Complete API documentation |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment guide |
| [Development Guide](docs/DEVELOPMENT.md) | Development setup and guidelines |

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/recapvideo
REDIS_URL=redis://localhost:6379/0

# JWT (IMPORTANT: Change in production!)
JWT_SECRET_KEY=your-secret-key

# External APIs
GEMINI_API_KEY=your-gemini-key
TRANSCRIPT_API_KEY=your-transcript-key
R2_ACCESS_KEY_ID=your-r2-key
R2_SECRET_ACCESS_KEY=your-r2-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

# Telegram (Order notifications)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Team

- **Developer**: RecapVideo.AI Team
- **Contact**: support@recapvideo.ai
