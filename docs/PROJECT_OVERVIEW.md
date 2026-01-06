# RecapVideo.AI v3 - Project Overview

## 📁 Complete Project Structure

```
recapvideo-v3/
├── 📄 README.md                    # Project documentation
├── 📄 DEVELOPMENT_PLAN.md          # Development roadmap
├── 📄 docker-compose.yml           # Main Docker configuration
├── 📄 docker-compose.workers.yml   # Worker services configuration
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 backend/                     # FastAPI Backend
│   ├── 📄 requirements.txt         # Python dependencies
│   ├── 📄 alembic.ini             # Database migration config
│   ├── 📄 .env.example            # Backend env template
│   ├── 📁 alembic/                # Database migrations
│   └── 📁 app/                    # Main application
│       ├── 📄 main.py             # FastAPI entry point
│       ├── 📄 __init__.py
│       ├── 📁 api/                # API routes
│       │   └── 📁 v1/
│       │       ├── 📄 router.py   # Main API router
│       │       └── 📁 endpoints/  # API endpoints
│       │           ├── 📄 auth.py
│       │           ├── 📄 users.py
│       │           ├── 📄 videos.py
│       │           ├── 📄 credits.py
│       │           ├── 📄 orders.py
│       │           ├── 📄 health.py
│       │           └── 📄 admin_api_keys.py
│       ├── 📁 core/               # Core configuration
│       │   ├── 📄 config.py       # Settings & env vars
│       │   ├── 📄 database.py     # Database connection
│       │   ├── 📄 dependencies.py # FastAPI dependencies
│       │   └── 📄 security.py     # JWT & password hashing
│       ├── 📁 models/             # SQLAlchemy models
│       │   ├── 📄 user.py
│       │   ├── 📄 video.py
│       │   ├── 📄 credit.py
│       │   ├── 📄 order.py
│       │   └── 📄 api_key.py
│       ├── 📁 schemas/            # Pydantic schemas
│       │   ├── 📄 user.py
│       │   ├── 📄 video.py
│       │   ├── 📄 credit.py
│       │   ├── 📄 order.py
│       │   └── 📄 api_key.py
│       ├── 📁 services/           # Business logic services
│       │   ├── 📄 transcript_service.py
│       │   ├── 📄 script_service.py
│       │   ├── 📄 tts_service.py
│       │   ├── 📄 storage_service.py
│       │   ├── 📄 email_service.py
│       │   └── 📄 api_key_service.py
│       └── 📁 processing/         # Video processing
│           ├── 📄 video_processor.py
│           ├── 📄 tasks.py        # Celery tasks
│           └── 📄 celery_config.py
│
├── 📁 frontend/                   # Next.js Frontend
│   ├── 📄 package.json           # Node dependencies
│   ├── 📄 next.config.js         # Next.js config
│   ├── 📄 tailwind.config.ts     # Tailwind CSS config
│   ├── 📄 tsconfig.json          # TypeScript config
│   ├── 📄 .env.example           # Frontend env template
│   ├── 📁 app/                   # Next.js App Router
│   │   ├── 📄 layout.tsx         # Root layout
│   │   ├── 📄 globals.css        # Global styles
│   │   ├── 📁 (marketing)/       # Public pages
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx       # Landing page
│   │   ├── 📁 (auth)/            # Authentication pages
│   │   │   ├── 📄 layout.tsx
│   │   │   ├── 📁 login/
│   │   │   └── 📁 signup/
│   │   ├── 📁 (dashboard)/       # User dashboard
│   │   │   ├── 📄 layout.tsx
│   │   │   ├── 📄 page.tsx       # Dashboard home
│   │   │   ├── 📁 videos/
│   │   │   ├── 📁 credits/
│   │   │   ├── 📁 buy/
│   │   │   └── 📁 profile/
│   │   └── 📁 (admin)/           # Admin panel
│   │       ├── 📄 layout.tsx
│   │       └── 📁 admin/
│   │           ├── 📄 page.tsx   # Admin dashboard
│   │           ├── 📁 users/
│   │           ├── 📁 videos/
│   │           ├── 📁 orders/
│   │           ├── 📁 prompts/
│   │           └── 📁 settings/
│   ├── 📁 components/            # React components
│   │   ├── 📄 providers.tsx      # Context providers
│   │   ├── 📁 ui/               # shadcn/ui components
│   │   ├── 📁 auth/             # Auth components
│   │   ├── 📁 layout/           # Layout components
│   │   ├── 📁 video/            # Video components
│   │   └── 📁 admin/            # Admin components
│   ├── 📁 stores/               # Zustand state stores
│   │   ├── 📄 auth-store.ts
│   │   ├── 📄 video-store.ts
│   │   └── 📄 ui-store.ts
│   ├── 📁 hooks/                # Custom React hooks
│   │   ├── 📄 use-auth.ts
│   │   ├── 📄 use-videos.ts
│   │   └── 📄 use-credits.ts
│   └── 📁 lib/                  # Utilities
│       ├── 📄 api.ts            # Axios API client
│       └── 📄 utils.ts          # Helper functions
│
└── 📁 docker/                    # Docker configurations
    ├── 📄 Dockerfile.backend     # Backend Docker image
    └── 📄 Dockerfile.frontend    # Frontend Docker image
```

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109+ | Web framework |
| **Python** | 3.11+ | Runtime |
| **SQLAlchemy** | 2.0+ | Async ORM |
| **PostgreSQL** | 15+ | Database |
| **Redis** | 7+ | Cache & Queue |
| **Celery** | 5+ | Task processing |
| **Pydantic** | 2.0+ | Data validation |
| **Alembic** | 1.13+ | DB migrations |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2+ | React framework |
| **React** | 18.2+ | UI library |
| **TypeScript** | 5.3+ | Type safety |
| **Tailwind CSS** | 3.4+ | Styling |
| **Zustand** | 4.4+ | State management |
| **React Query** | 5.17+ | Server state |
| **Radix UI** | Latest | UI primitives |

### External Services
| Service | Purpose | Cost |
|---------|---------|------|
| **TranscriptAPI** | YouTube transcripts | Paid |
| **Google Gemini** | AI script generation | FREE tier |
| **Edge-TTS** | Text-to-speech | FREE |
| **Cloudflare R2** | File storage | Cheap |
| **Resend** | Email service | FREE tier |

---

## 📊 Feature Completion Status

| Module | Backend | Frontend | Status |
|--------|---------|----------|--------|
| Authentication | ✅ 100% | ✅ 100% | Complete |
| User Management | ✅ 100% | ✅ 100% | Complete |
| Video Processing | ✅ 95% | ✅ 90% | Near Complete |
| Credits System | ✅ 100% | ✅ 100% | Complete |
| Orders/Payments | ✅ 90% | ✅ 90% | Near Complete |
| Admin Dashboard | ✅ 85% | ✅ 95% | Near Complete |
| Admin Users | ✅ 85% | ✅ 100% | Near Complete |
| Admin Videos | ✅ 85% | ✅ 100% | Near Complete |
| Admin Orders | ✅ 85% | ✅ 100% | Near Complete |
| Admin Settings | ⬜ 0% | ✅ 100% | Frontend Only |

---

## 🚀 Quick Start

### Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Production (Docker)

```bash
docker-compose up -d
```

---

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| [AUTHENTICATION.md](./AUTHENTICATION.md) | Auth system documentation |
| [VIDEO_PROCESSING.md](./VIDEO_PROCESSING.md) | Video pipeline documentation |
| [CREDITS_SYSTEM.md](./CREDITS_SYSTEM.md) | Credits & billing documentation |
| [ADMIN_PANEL.md](./ADMIN_PANEL.md) | Admin panel documentation |
| [API_REFERENCE.md](./API_REFERENCE.md) | API endpoints reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
