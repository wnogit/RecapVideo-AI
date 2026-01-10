# RecapVideo.AI - Development Guide

> Development setup and coding guidelines for RecapVideo.AI v3

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **PostgreSQL** 15+
- **Redis** 7+
- **FFmpeg** (for video processing)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/wnogit/RecapVideo-AI.git
cd RecapVideo-AI/recapvideo-v3
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your settings
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run migrations
cd backend
alembic upgrade head
```

### 5. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

---

## 📁 Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/        # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── videos.py     # Video CRUD endpoints
│   │   │   ├── credits.py    # Credit endpoints
│   │   │   ├── orders.py     # Order endpoints
│   │   │   └── admin_*.py    # Admin endpoints
│   │   └── router.py         # Route aggregator
│   ├── core/
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── dependencies.py   # FastAPI dependencies
│   │   └── security.py       # JWT, password hashing
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   │   ├── transcript_service.py
│   │   ├── script_service.py
│   │   ├── tts_service.py
│   │   └── video_processing_service.py
│   └── processing/           # Celery tasks
└── alembic/                  # Database migrations
```

### Frontend Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin routes (protected)
│   ├── (auth)/              # Auth pages
│   ├── (dashboard)/         # User dashboard (protected)
│   └── (marketing)/         # Public landing pages
├── components/
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Auth forms
│   ├── layout/              # Header, Sidebar, Footer
│   ├── ui/                  # shadcn/ui components
│   └── video/               # Video creation components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── api.ts               # Axios API client
│   ├── types/               # TypeScript types
│   └── utils.ts             # Utilities
└── stores/                  # Zustand state stores
```

---

## 📝 Coding Standards

### Python (Backend)

1. **Type Hints Required**
   ```python
   # ✅ Good
   async def create_video(user_id: UUID, url: str) -> Video:
       ...
   
   # ❌ Bad
   async def create_video(user_id, url):
       ...
   ```

2. **Use Pydantic for Validation**
   ```python
   from pydantic import BaseModel, Field
   
   class VideoCreate(BaseModel):
       source_url: str = Field(..., description="YouTube URL")
       voice_type: str = Field(default="my-MM-NilarNeural")
   ```

3. **Async Functions**
   - All database operations must be async
   - Use `async with` for sessions

4. **Error Handling**
   ```python
   from fastapi import HTTPException, status
   
   raise HTTPException(
       status_code=status.HTTP_404_NOT_FOUND,
       detail="Video not found"
   )
   ```

5. **Logging**
   ```python
   from loguru import logger
   
   logger.info(f"Processing video: {video_id}")
   logger.error(f"Failed to process: {error}")
   ```

### TypeScript (Frontend)

1. **No `any` Type**
   ```typescript
   // ✅ Good
   interface User {
     id: string;
     email: string;
     name: string;
   }
   
   // ❌ Bad
   const user: any = response.data;
   ```

2. **Proper Error Handling**
   ```typescript
   import { AxiosError } from 'axios';
   
   interface ApiError {
     detail?: string;
   }
   
   try {
     await api.post('/videos', data);
   } catch (error) {
     const axiosError = error as AxiosError<ApiError>;
     const message = axiosError.response?.data?.detail || 'Failed';
   }
   ```

3. **Use 'use client' Properly**
   - Only add to components that need client-side features
   - Keep server components as default

4. **Component Organization**
   ```typescript
   // Component file structure
   'use client';  // if needed
   
   import ... // External imports
   import ... // Internal imports
   
   interface Props { ... }
   
   export function ComponentName({ ... }: Props) {
     // hooks
     // handlers
     // render
   }
   ```

---

## 🗃️ Database Migrations

### Create New Migration

```bash
cd backend
alembic revision -m "add_new_column"
```

### Edit Migration File

```python
# alembic/versions/xxx_add_new_column.py

def upgrade():
    op.add_column('videos', sa.Column('new_field', sa.String(100)))

def downgrade():
    op.drop_column('videos', 'new_field')
```

### Run Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# Show current version
alembic current
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🔄 Git Workflow

### Branch Naming

- `feature/add-voice-selection`
- `fix/video-processing-error`
- `hotfix/security-patch`

### Commit Messages

```
feat: add voice selection to video creation
fix: resolve video processing timeout issue
docs: update API documentation
refactor: simplify credit calculation logic
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with proper commits
3. Push and create PR
4. Request review
5. Merge after approval

---

## 🐛 Debugging

### Backend Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use logger
from loguru import logger
logger.debug(f"Variable value: {variable}")
```

### Frontend Debugging

```typescript
// Console logging
console.log('Debug:', variable);

// React DevTools
// Use React Developer Tools browser extension
```

### API Debugging

- Use http://localhost:8000/api/docs for Swagger UI
- Use Postman or Insomnia for testing

---

## 📦 Adding Dependencies

### Backend

```bash
cd backend
pip install new-package
pip freeze > requirements.txt
```

### Frontend

```bash
cd frontend
npm install new-package
```

---

## 🔐 Security Notes

1. **Never commit secrets** - Use `.env` files
2. **Validate all inputs** - Use Pydantic schemas
3. **Sanitize outputs** - Prevent XSS
4. **Use parameterized queries** - SQLAlchemy handles this
5. **Rate limit endpoints** - Already configured
