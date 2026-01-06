# 📋 RecapVideo.AI v3 - Development Plan

> **Created:** January 3, 2026  
> **Starting Fresh:** Yes - No migration from v2  
> **Priority:** Complete Backend → Frontend → Docker → Testing

---

## 📊 Current Project Status

### ✅ COMPLETED (Backend)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **Core Config** | `core/config.py` | ✅ 100% | Pydantic settings with all env vars |
| **Database** | `core/database.py` | ✅ 100% | Async SQLAlchemy 2.0 setup |
| **Security** | `core/security.py` | ✅ 100% | JWT, password hashing, token verify |
| **Dependencies** | `core/dependencies.py` | ✅ 100% | FastAPI dependency injection |
| **Main App** | `main.py` | ✅ 100% | FastAPI app with lifespan, CORS, router |
| **User Model** | `models/user.py` | ✅ 100% | UUID PK, relationships, timestamps |
| **Video Model** | `models/video.py` | ✅ 100% | VideoStatus enum, all fields |
| **Credit Model** | `models/credit.py` | ✅ 100% | Transaction types, balance tracking |
| **Order Model** | `models/order.py` | ✅ 100% | Order status, payment tracking |
| **API Key Model** | `models/api_key.py` | ✅ 100% | Multiple API key management |
| **User Schema** | `schemas/user.py` | ✅ 100% | Pydantic v2 schemas |
| **Video Schema** | `schemas/video.py` | ✅ 100% | Create, Response, List schemas |
| **Credit Schema** | `schemas/credit.py` | ✅ 100% | Transaction schemas |
| **Order Schema** | `schemas/order.py` | ✅ 100% | Order CRUD schemas |
| **Auth Endpoints** | `api/v1/endpoints/auth.py` | ✅ 100% | signup, login, refresh, password reset |
| **Videos Endpoints** | `api/v1/endpoints/videos.py` | ✅ 100% | CRUD with pagination |
| **Users Endpoints** | `api/v1/endpoints/users.py` | ✅ 100% | Profile CRUD |
| **Credits Endpoints** | `api/v1/endpoints/credits.py` | ✅ 100% | Balance, transactions, packages |
| **Orders Endpoints** | `api/v1/endpoints/orders.py` | ✅ 100% | Order CRUD, screenshot upload |
| **Health Endpoints** | `api/v1/endpoints/health.py` | ✅ 100% | Health check |
| **API Router** | `api/v1/router.py` | ✅ 100% | All routes aggregated |
| **Transcript Service** | `services/transcript_service.py` | ✅ 100% | TranscriptAPI.com integration |
| **TTS Service** | `services/tts_service.py` | ✅ 100% | Edge-TTS implementation |
| **Script Service** | `services/script_service.py` | ✅ 100% | Gemini script generation |
| **Storage Service** | `services/storage_service.py` | ✅ 100% | Cloudflare R2 upload/download |
| **Email Service** | `services/email_service.py` | ✅ 100% | Resend email integration |
| **API Key Service** | `services/api_key_service.py` | ✅ 100% | API key management |
| **Video Processor** | `processing/video_processor.py` | ✅ 100% | Full pipeline implementation |
| **Celery Config** | `processing/celery_config.py` | ✅ 100% | Celery + Redis setup |
| **Celery Tasks** | `processing/tasks.py` | ✅ 100% | Background video tasks |

### ✅ COMPLETED (Frontend)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **App Layout** | `app/layout.tsx` | ✅ 100% | Root layout with metadata |
| **Global Styles** | `app/globals.css` | ✅ 100% | Tailwind base styles |
| **Providers** | `components/providers.tsx` | ✅ 100% | React Query + Theme provider |
| **Toaster** | `components/ui/toaster.tsx` | ✅ 100% | Toast notifications |
| **API Client** | `lib/api.ts` | ✅ 100% | Axios with interceptors |
| **Utils** | `lib/utils.ts` | ✅ 100% | cn helper function |
| **Config** | `next.config.js` | ✅ 100% | Next.js config |
| **Tailwind Config** | `tailwind.config.ts` | ✅ 100% | Theme configuration |
| **TypeScript Config** | `tsconfig.json` | ✅ 100% | TypeScript settings |
| **Package.json** | `package.json` | ✅ 100% | All dependencies |
| **Auth Store** | `stores/auth-store.ts` | ✅ 100% | Zustand auth state |
| **Video Store** | `stores/video-store.ts` | ✅ 100% | Zustand video state |
| **UI Store** | `stores/ui-store.ts` | ✅ 100% | Zustand UI state |
| **useAuth Hook** | `hooks/use-auth.ts` | ✅ 100% | Auth utilities |
| **useVideos Hook** | `hooks/use-videos.ts` | ✅ 100% | Video utilities |
| **useCredits Hook** | `hooks/use-credits.ts` | ✅ 100% | Credit utilities |
| **Button** | `components/ui/button.tsx` | ✅ 100% | shadcn button |
| **Input** | `components/ui/input.tsx` | ✅ 100% | shadcn input |
| **Card** | `components/ui/card.tsx` | ✅ 100% | shadcn card |
| **Label** | `components/ui/label.tsx` | ✅ 100% | shadcn label |
| **Badge** | `components/ui/badge.tsx` | ✅ 100% | shadcn badge |
| **Avatar** | `components/ui/avatar.tsx` | ✅ 100% | shadcn avatar |
| **Progress** | `components/ui/progress.tsx` | ✅ 100% | shadcn progress |
| **Select** | `components/ui/select.tsx` | ✅ 100% | shadcn select |
| **AuthGuard** | `components/auth/auth-guard.tsx` | ✅ 100% | Route protection |
| **LoginForm** | `components/auth/login-form.tsx` | ✅ 100% | Login form |
| **SignupForm** | `components/auth/signup-form.tsx` | ✅ 100% | Signup form |
| **Sidebar** | `components/layout/sidebar.tsx` | ✅ 100% | Dashboard sidebar |
| **Header** | `components/layout/header.tsx` | ✅ 100% | Dashboard header |
| **VideoForm** | `components/video/video-form.tsx` | ✅ 100% | Video creation form |
| **VideoCard** | `components/video/video-card.tsx` | ✅ 100% | Video list item |
| **Auth Layout** | `app/(auth)/layout.tsx` | ✅ 100% | Auth pages layout |
| **Login Page** | `app/(auth)/login/page.tsx` | ✅ 100% | Login page |
| **Signup Page** | `app/(auth)/signup/page.tsx` | ✅ 100% | Signup page |
| **Dashboard Layout** | `app/(dashboard)/layout.tsx` | ✅ 100% | Dashboard layout |
| **Dashboard Home** | `app/(dashboard)/page.tsx` | ✅ 100% | Video creation |
| **Videos Page** | `app/(dashboard)/videos/page.tsx` | ✅ 100% | My videos |
| **Credits Page** | `app/(dashboard)/credits/page.tsx` | ✅ 100% | Credit balance |
| **Buy Page** | `app/(dashboard)/buy/page.tsx` | ✅ 100% | Buy credits |
| **Profile Page** | `app/(dashboard)/profile/page.tsx` | ✅ 100% | User profile |
| **Marketing Layout** | `app/(marketing)/layout.tsx` | ✅ 100% | Landing layout |
| **Landing Page** | `app/(marketing)/page.tsx` | ✅ 100% | Landing page |

---

### ❌ NOT COMPLETED

#### Backend - Missing

| Component | Priority | Description |
|-----------|----------|-------------|
| **Admin Endpoints** | 🔴 High | User management, stats, order approval |
| **WebSocket** | 🟡 Medium | Real-time video processing updates |
| **Alembic Migrations** | 🔴 High | Database migration scripts |
| **Unit Tests** | 🟢 Low | pytest test files |
| **Rate Limiting** | 🟡 Medium | SlowAPI integration |

#### Frontend - Missing (MOST WORK NEEDED)

| Component | Priority | Description |
|-----------|----------|-------------|
| **Landing Page** | 🔴 High | `app/(marketing)/page.tsx` |
| **Login Page** | 🔴 High | `app/(auth)/login/page.tsx` |
| **Signup Page** | 🔴 High | `app/(auth)/signup/page.tsx` |
| **Dashboard Layout** | 🔴 High | `app/(dashboard)/layout.tsx` |
| **Dashboard Home** | 🔴 High | `app/(dashboard)/page.tsx` - Video creation |
| **My Videos** | 🔴 High | `app/(dashboard)/videos/page.tsx` |
| **Credits Page** | 🔴 High | `app/(dashboard)/credits/page.tsx` |
| **Buy Credits** | 🔴 High | `app/(dashboard)/buy/page.tsx` |
| **Profile Page** | 🟡 Medium | `app/(dashboard)/profile/page.tsx` |
| **Admin Layout** | 🟡 Medium | `app/(admin)/layout.tsx` |
| **Admin Dashboard** | 🟡 Medium | `app/(admin)/admin/page.tsx` |
| **Admin Users** | 🟡 Medium | `app/(admin)/admin/users/page.tsx` |
| **Admin Orders** | 🟡 Medium | `app/(admin)/admin/orders/page.tsx` |
| **UI Components** | 🔴 High | shadcn/ui components |
| **Auth Store** | 🔴 High | Zustand auth store |
| **Video Store** | 🟡 Medium | Zustand video store |
| **Auth Hook** | 🔴 High | useAuth hook |
| **Video Hook** | 🟡 Medium | useVideos hook |

#### DevOps - Missing

| Component | Priority | Description |
|-----------|----------|-------------|
| **docker-compose.yml** | 🔴 High | Production compose file |
| **Dockerfile.backend** | 🔴 High | Backend container |
| **Dockerfile.frontend** | 🔴 High | Frontend container |
| **.env.example** | 🔴 High | Environment template |

---

## 🎯 Development Phases

### Phase 1: Backend Completion (1-2 days)

1. ✅ Core API endpoints - DONE
2. ⬜ Create Alembic migrations
3. ⬜ Add admin endpoints
4. ⬜ Add rate limiting
5. ⬜ Test all endpoints

### Phase 2: Frontend Core (3-4 days)

1. ⬜ Setup shadcn/ui components
2. ⬜ Create auth pages (login, signup)
3. ⬜ Create dashboard layout
4. ⬜ Create video creation page
5. ⬜ Create my videos page
6. ⬜ Create credits page
7. ⬜ Create buy credits page

### Phase 3: Frontend Polish (2-3 days)

1. ⬜ Landing page with animations
2. ⬜ Profile page
3. ⬜ Admin panel
4. ⬜ Mobile responsiveness
5. ⬜ Error handling

### Phase 4: DevOps & Testing (1-2 days)

1. ⬜ Docker setup
2. ⬜ Database migrations
3. ⬜ Environment configuration
4. ⬜ Basic testing

---

## 🚀 Next Steps (In Order)

### Step 1: Install shadcn/ui Components

```bash
cd frontend
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card form label toast dialog dropdown-menu avatar badge progress tabs select sheet separator skeleton
```

### Step 2: Create Zustand Stores

- `stores/auth-store.ts`
- `stores/video-store.ts`
- `stores/ui-store.ts`

### Step 3: Create Custom Hooks

- `hooks/use-auth.ts`
- `hooks/use-videos.ts`
- `hooks/use-credits.ts`

### Step 4: Create Pages (Priority Order)

1. Login page
2. Signup page
3. Dashboard layout
4. Dashboard home (video creation)
5. My videos page
6. Credits page
7. Buy credits page
8. Landing page
9. Profile page
10. Admin pages

---

## 📁 Target Directory Structure

```
recapvideo-v3/
├── frontend/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx              # ❌ Landing page
│   │   │   └── layout.tsx            # ❌ Marketing layout
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # ❌ Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx          # ❌ Signup page
│   │   │   └── layout.tsx            # ❌ Auth layout
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              # ❌ Dashboard home
│   │   │   ├── videos/
│   │   │   │   └── page.tsx          # ❌ My videos
│   │   │   ├── credits/
│   │   │   │   └── page.tsx          # ❌ Credits
│   │   │   ├── buy/
│   │   │   │   └── page.tsx          # ❌ Buy credits
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # ❌ Profile
│   │   │   └── layout.tsx            # ❌ Dashboard layout
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # ❌ Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx      # ❌ User management
│   │   │   │   └── orders/
│   │   │   │       └── page.tsx      # ❌ Order management
│   │   │   └── layout.tsx            # ❌ Admin layout
│   │   ├── layout.tsx                # ✅ Root layout
│   │   └── globals.css               # ✅ Global styles
│   ├── components/
│   │   ├── ui/                       # ❌ shadcn components
│   │   ├── layout/
│   │   │   ├── header.tsx            # ❌ Site header
│   │   │   ├── sidebar.tsx           # ❌ Dashboard sidebar
│   │   │   └── footer.tsx            # ❌ Site footer
│   │   ├── auth/
│   │   │   ├── login-form.tsx        # ❌ Login form
│   │   │   ├── signup-form.tsx       # ❌ Signup form
│   │   │   └── auth-guard.tsx        # ❌ Route protection
│   │   └── video/
│   │       ├── video-form.tsx        # ❌ Video creation form
│   │       ├── video-card.tsx        # ❌ Video list item
│   │       └── progress.tsx          # ❌ Processing progress
│   ├── stores/
│   │   ├── auth-store.ts             # ❌ Auth state
│   │   └── video-store.ts            # ❌ Video state
│   ├── hooks/
│   │   ├── use-auth.ts               # ❌ Auth hook
│   │   └── use-videos.ts             # ❌ Videos hook
│   └── lib/
│       ├── api.ts                    # ✅ API client
│       └── utils.ts                  # ✅ Utilities
├── backend/                          # ✅ 95% Complete
├── docker/
│   ├── Dockerfile.backend            # ❌ Backend container
│   └── Dockerfile.frontend           # ❌ Frontend container
└── docker-compose.yml                # ❌ Production compose
```

---

## 🔑 Key Files to Create (Priority Order)

### Backend (Optional - Already Functional)

1. `backend/alembic/versions/001_initial.py` - Initial migration

### Frontend (REQUIRED)

1. **Zustand Stores**
   - `stores/auth-store.ts`
   
2. **Auth Pages**
   - `app/(auth)/layout.tsx`
   - `app/(auth)/login/page.tsx`
   - `app/(auth)/signup/page.tsx`

3. **Dashboard**
   - `app/(dashboard)/layout.tsx`
   - `app/(dashboard)/page.tsx`
   - `app/(dashboard)/videos/page.tsx`
   - `app/(dashboard)/credits/page.tsx`
   - `app/(dashboard)/buy/page.tsx`

4. **Components**
   - `components/layout/header.tsx`
   - `components/layout/sidebar.tsx`
   - `components/auth/login-form.tsx`
   - `components/auth/signup-form.tsx`
   - `components/auth/auth-guard.tsx`
   - `components/video/video-form.tsx`
   - `components/video/video-card.tsx`

5. **Landing**
   - `app/(marketing)/layout.tsx`
   - `app/(marketing)/page.tsx`

---

## 📅 Estimated Timeline

| Phase | Duration | End Date |
|-------|----------|----------|
| Backend Polish | 1 day | Jan 4, 2026 |
| Frontend Core | 4 days | Jan 8, 2026 |
| Frontend Polish | 3 days | Jan 11, 2026 |
| Docker & Testing | 2 days | Jan 13, 2026 |
| **Total** | **10 days** | **Jan 13, 2026** |

---

## 🚀 Ready to Start!

Run these commands to begin development:

```bash
# Terminal 1: Backend
cd recapvideo-v3/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd recapvideo-v3/frontend
npm install
npx shadcn-ui@latest init
npm run dev
```

---

**Let's build this! 🎬✨**
