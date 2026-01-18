# RecapVideo.AI v3 - Project ပြည့်စုံစွာ ခွဲခြမ်းစိတ်ဖြာခြင်း

> AI-powered YouTube video recap generator - မြန်မာဘာသာ support

---

## 📋 မာတိကာ

1. [Project အကျဉ်းချုပ်](#project-အကျဉ်းချုပ်)
2. [Architecture Overview](#architecture-overview)
3. [Backend (FastAPI)](#backend-fastapi)
4. [Frontend (Next.js)](#frontend-nextjs)
5. [Mobile App (Flutter)](#mobile-app-flutter)
6. [Tech Stack အသေးစိတ်](#tech-stack-အသေးစိတ်)
7. [File Structure](#file-structure)

---

## 🎯 Project အကျဉ်းချုပ်

RecapVideo.AI သည် YouTube videos များကို မြန်မာဘာသာဖြင့် recap videos အဖြစ် ပြောင်းလဲပေးသော AI-powered platform ဖြစ်ပါသည်။

### အဓိက Features

| Feature | ဖော်ပြချက် |
|---------|-----------|
| YouTube Transcript Extraction | YouTube video မှ transcript ထုတ်ယူခြင်း |
| AI Translation | Google Gemini ဖြင့် မြန်မာဘာသာ ဘာသာပြန်ခြင်း |
| Text-to-Speech | Edge-TTS (FREE) ဖြင့် မြန်မာ voiceover |
| Video Rendering | FFmpeg ဖြင့် video ဖန်တီးခြင်း |
| Credit System | Credit-based payment system |
| Admin Dashboard | Admin management interface |

### Business Model

- **Credit-based System**: Users များ credits ဝယ်ယူ၍ videos ဖန်တီး
- **Trial Credits**: အသစ် users အတွက် 4 free credits
- **Manual Approval**: Admin က Telegram မှတဆင့် orders approve

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RECAPVIDEO.AI v3                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │  Frontend   │────▶│   Backend   │────▶│   PostgreSQL    │   │
│  │  Next.js 14 │     │   FastAPI   │     │   + Redis       │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│         │                   │                                    │
│         │                   ▼                                    │
│  ┌──────────────┐   ┌──────────────────────────────────────┐   │
│  │  Mobile App  │   │           VIDEO PROCESSING           │   │
│  │   Flutter    │   │  Celery Workers + FFmpeg Pipeline    │   │
│  └──────────────┘   └──────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### External Services

| Service | ရည်ရွယ်ချက် | Cost |
|---------|-------------|------|
| TranscriptAPI.com | YouTube transcript extraction | Paid |
| Google Gemini | AI translation & script generation | Paid |
| Edge-TTS | Text-to-Speech (Burmese) | FREE |
| Cloudflare R2 | Video/Audio storage | Paid |
| Resend | Email notifications | Paid |
| Telegram Bot | Order notifications | FREE |

---

## 🐍 Backend (FastAPI)

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── api/                 # API routes
│   │   └── v1/
│   │       ├── router.py    # Main API router
│   │       └── endpoints/   # API endpoints (20 files)
│   ├── core/                # Core configuration
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── processing/          # Video processing
├── alembic/                 # Database migrations
└── requirements.txt         # Python dependencies
```

### main.py - Application Entry Point

```python
# RecapVideo.AI - FastAPI Main Application
# Features:
# - CORS middleware
# - GZip compression
# - Rate limiting (SlowAPI)
# - Health check endpoint
# - Static file serving
# - Pending video resume on startup
```

**အဓိက Functions:**

| Function | ရည်ရွယ်ချက် |
|----------|-------------|
| `resume_pending_videos()` | Server restart ပြီးနောက် interrupted videos resume |
| `lifespan()` | Application startup/shutdown events |
| `create_application()` | FastAPI app configuration |

---

### API Endpoints (`app/api/v1/endpoints/`)

**20 endpoint files ရှိပါသည်:**

#### 🔐 Authentication & Users

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `auth.py` | 40,169 bytes | Login, Register, Google OAuth, Password reset, JWT tokens |
| `users.py` | 13,248 bytes | User profile management, CRUD operations |
| `sessions.py` | 4,700 bytes | User session management |

#### 🎬 Videos & Processing

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `videos.py` | 10,023 bytes | Video CRUD, processing triggers |
| `voices.py` | 3,737 bytes | Voice selection (Edge-TTS voices) |
| `uploads.py` | 3,832 bytes | File upload handling |

#### 💳 Orders & Payments

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `orders.py` | 12,416 bytes | Order creation และ management |
| `credits.py` | 3,212 bytes | User credit balance |
| `credit_packages.py` | 7,393 bytes | Credit package CRUD |
| `payment_methods.py` | 8,280 bytes | Payment method management |

#### 👨‍💼 Admin Endpoints

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `admin_dashboard.py` | 8,066 bytes | Admin statistics และ metrics |
| `admin_users.py` | 13,433 bytes | User management (ban, credits) |
| `admin_orders.py` | 8,628 bytes | Order approval/rejection |
| `admin_videos.py` | 8,769 bytes | Video management |
| `admin_prompts.py` | 10,952 bytes | AI prompt configuration |
| `admin_api_keys.py` | 12,554 bytes | API keys management |

#### ⚙️ System

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `site_settings.py` | 18,904 bytes | Site configuration |
| `telegram.py` | 8,695 bytes | Telegram webhook handling |
| `health.py` | 858 bytes | Health check |

---

### Core Modules (`app/core/`)

| File | Size | ဖော်ပြချက် |
|------|------|-----------|
| `config.py` | 4,285 bytes | Application settings (Pydantic Settings) |
| `database.py` | 2,480 bytes | Async SQLAlchemy engine, session |
| `security.py` | 5,910 bytes | JWT token creation, password hashing |
| `dependencies.py` | 3,150 bytes | FastAPI dependencies (get_current_user) |
| `celery_app.py` | 1,806 bytes | Celery configuration |
| `rate_limiter.py` | 1,922 bytes | SlowAPI rate limiting |
| `cookies.py` | 3,202 bytes | Cookie handling |

---

### Database Models (`app/models/`)

**12 SQLAlchemy models:**

| Model | Size | ဖော်ပြချက် |
|-------|------|-----------|
| `user.py` | 5,662 bytes | User account (email, password, credits, role) |
| `video.py` | 6,073 bytes | Video metadata (status, URL, settings) |
| `order.py` | 3,355 bytes | Payment orders |
| `credit.py` | 2,425 bytes | Credit transactions |
| `credit_package.py` | 1,820 bytes | Credit packages (products) |
| `payment_method.py` | 2,399 bytes | Payment methods (KBZ Pay, Wave) |
| `device.py` | 2,744 bytes | User devices tracking |
| `api_key.py` | 3,290 bytes | API keys management |
| `prompt.py` | 1,925 bytes | AI prompts storage |
| `site_settings.py` | 2,799 bytes | Site configuration |
| `token_blacklist.py` | 4,558 bytes | Revoked JWT tokens |

---

### Services (`app/services/`)

**13 business logic services:**

| Service | Size | ဖော်ပြချက် |
|---------|------|-----------|
| `script_service.py` | 18,314 bytes | AI script generation (Gemini, Groq, POE) |
| `telegram_service.py` | 17,404 bytes | Telegram bot notifications |
| `api_key_service.py` | 14,889 bytes | API key validation |
| `tts_service.py` | 10,755 bytes | Edge-TTS text-to-speech |
| `token_blacklist_service.py` | 9,819 bytes | JWT token blacklisting |
| `poe_service.py` | 7,983 bytes | POE AI integration |
| `email_service.py` | 7,181 bytes | Email sending (Resend) |
| `transcript_service.py` | 6,794 bytes | YouTube transcript extraction |
| `storage_service.py` | 6,453 bytes | Cloudflare R2 storage |
| `ip_service.py` | 4,874 bytes | IP address validation |
| `prompt_service.py` | 4,746 bytes | Prompt management |
| `rate_limit_service.py` | 4,623 bytes | Rate limiting logic |

---

### Video Processing Pipeline (`app/services/video_processing/`)

**12 video processing modules:**

| Module | Size | ဖော်ပြချက် |
|--------|------|-----------|
| `single_pass_processor.py` | 24,521 bytes | Main FFmpeg single-pass processor |
| `main_service.py` | 22,396 bytes | Video processing orchestration |
| `subtitle_service.py` | 6,619 bytes | SRT subtitle generation |
| `ffmpeg_utils.py` | 6,540 bytes | FFmpeg command helpers |
| `outro_service.py` | 5,534 bytes | Outro video generation |
| `logo_service.py` | 5,306 bytes | Logo overlay processing |
| `resize_service.py` | 4,408 bytes | Video resize (9:16, 16:9) |
| `blur_service.py` | 3,758 bytes | Background blur effect |
| `audio_service.py` | 3,667 bytes | Audio processing |
| `models.py` | 2,718 bytes | Processing data models |
| `copyright_service.py` | 2,142 bytes | Copyright check |

---

## ⚛️ Frontend (Next.js)

### Directory Structure

```
frontend/
├── app/                     # Next.js App Router
│   ├── (admin)/            # Admin dashboard routes
│   ├── (auth)/             # Authentication routes
│   ├── (dashboard)/        # User dashboard routes
│   ├── (marketing)/        # Landing pages
│   ├── auth/               # OAuth callbacks
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── admin/              # Admin components
│   ├── auth/               # Auth components
│   ├── icons/              # Custom icons
│   ├── layout/             # Layout components
│   ├── providers/          # Context providers
│   ├── ui/                 # shadcn/ui components
│   └── video/              # Video creation components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, API client
├── stores/                 # Zustand stores
└── middleware.ts           # Next.js middleware
```

### layout.tsx - Root Layout

**Features:**
- **Fonts**: Inter (Latin) + Noto Sans Myanmar (မြန်မာ)
- **SEO**: Complete metadata configuration
- **Providers**: Theme, Toast, Query providers

---

### Route Groups

#### `(admin)/` - Admin Dashboard

```
(admin)/
├── admin/
│   ├── layout.tsx
│   ├── page.tsx           # Dashboard overview
│   ├── api-keys/          # API keys management
│   ├── orders/            # Order management
│   ├── prompts/           # Prompt configuration
│   ├── settings/          # Site settings
│   ├── users/             # User management
│   └── videos/            # Video management
```

#### `(auth)/` - Authentication

```
(auth)/
├── login/page.tsx
├── register/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx
```

#### `(dashboard)/` - User Dashboard

```
(dashboard)/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx           # Main dashboard
│   ├── create/            # Video creation
│   ├── history/           # Video history
│   ├── orders/            # Order history
│   └── profile/           # User profile
```

#### `(marketing)/` - Landing Pages

```
(marketing)/
├── page.tsx               # Home page
├── pricing/               # Pricing page
├── features/              # Features page
└── about/                 # About page
```

---

### Components (`components/`)

#### UI Components (`components/ui/`) - 27 files

shadcn/ui components ပါဝင်ပါသည်:

| Component | ဖော်ပြချက် |
|-----------|-----------|
| `button.tsx` | Button variants |
| `input.tsx` | Form input |
| `dialog.tsx` | Modal dialogs |
| `dropdown-menu.tsx` | Dropdown menus |
| `toast.tsx` | Toast notifications |
| `tabs.tsx` | Tab navigation |
| `select.tsx` | Select dropdowns |
| `progress.tsx` | Progress bars |
| `slider.tsx` | Range sliders |
| `switch.tsx` | Toggle switches |
| `avatar.tsx` | User avatars |
| `checkbox.tsx` | Checkboxes |
| ... | နောက်ထပ် |

#### Video Components (`components/video/`) - 10 files

| Component | ဖော်ပြချက် |
|-----------|-----------|
| `video-creator.tsx` | Main video creation UI |
| `video-preview.tsx` | Live preview |
| `video-settings.tsx` | Video settings |
| `style-selector.tsx` | Style selection |
| `voice-selector.tsx` | Voice selection |
| `script-editor.tsx` | Script editing |
| ... | နောက်ထပ် |

#### Admin Components (`components/admin/`) - 5 files

| Component | ဖော်ပြချက် |
|-----------|-----------|
| `admin-sidebar.tsx` | Admin navigation |
| `stats-card.tsx` | Statistics cards |
| `data-table.tsx` | Data tables |
| ... | နောက်ထပ် |

---

### Stores (Zustand) (`stores/`)

| Store | ဖော်ပြချက် |
|-------|-----------|
| `auth-store.ts` | Authentication state |
| `video-store.ts` | Video creation state |
| `settings-store.ts` | User settings |
| `admin-store.ts` | Admin state |

---

### Hooks (`hooks/`)

| Hook | ဖော်ပြချက် |
|------|-----------|
| `useAuth.ts` | Authentication hook |
| `useVideo.ts` | Video operations |
| `useCredits.ts` | Credit balance |
| `useToast.ts` | Toast notifications |

---

### middleware.ts

**Features:**
- Route protection (authenticated routes)
- Admin route protection
- Token refresh logic
- Device fingerprinting

---

## 📱 Mobile App (Flutter)

### Directory Structure

```
mobile-app/
├── lib/
│   ├── main.dart           # App entry point
│   ├── core/               # Core modules
│   │   ├── api/            # API client (Dio)
│   │   ├── config/         # App configuration
│   │   ├── constants/      # Constants
│   │   ├── l10n/           # Localization
│   │   ├── models/         # Data models
│   │   ├── navigation/     # Navigation
│   │   ├── providers/      # Riverpod providers
│   │   ├── router/         # GoRouter
│   │   ├── security/       # Security
│   │   ├── theme/          # App theme
│   │   └── utils/          # Utilities
│   └── features/           # Feature modules
│       ├── auth/           # Authentication
│       ├── credits/        # Credit management
│       ├── home/           # Home screen
│       ├── profile/        # User profile
│       ├── video_creation/ # Video creation
│       └── videos/         # Video list
├── android/                # Android platform
├── ios/                    # iOS platform
├── web/                    # Web platform
├── assets/                 # App assets
└── pubspec.yaml           # Dependencies
```

---

### main.dart - App Entry Point

```dart
// Features:
// - ProviderScope (Riverpod)
// - MaterialApp.router (GoRouter)
// - Theme configuration (Light/Dark)
// - Locale support (Myanmar)
// - Splash screen with animation
// - Auth initialization
```

**Main Classes:**

| Class | ဖော်ပြချက် |
|-------|-----------|
| `RecapVideoApp` | ConsumerStatefulWidget - main app |
| `_RecapVideoAppState` | App state with auth init |

**Key Methods:**

| Method | ဖော်ပြချက် |
|--------|-----------|
| `_initializeAuth()` | Auth provider initialize |
| `_buildSplashScreen()` | Splash screen UI |
| `_buildLogoAnimation()` | Logo animation widget |

---

### Core Modules (`lib/core/`)

#### API (`core/api/`) - 6 files

| File | ဖော်ပြချက် |
|------|-----------|
| `api_client.dart` | Dio HTTP client |
| `api_endpoints.dart` | API endpoint URLs |
| `api_interceptor.dart` | Auth token interceptor |
| `api_response.dart` | Response model |
| `error_handler.dart` | Error handling |

#### Providers (`core/providers/`) - 4 files

| Provider | ဖော်ပြချက် |
|----------|-----------|
| `theme_provider.dart` | ThemeMode provider |
| `locale_provider.dart` | Locale provider (Myanmar) |
| `auth_provider.dart` | Authentication state |
| `connectivity_provider.dart` | Network connectivity |

#### Router (`core/router/`)

| File | ဖော်ပြချက် |
|------|-----------|
| `app_router.dart` | GoRouter configuration |

**Routes:**
- `/login` - Login screen
- `/home` - Home screen
- `/create` - Video creation
- `/videos` - Video list
- `/video/:id` - Video detail
- `/credits` - Credit purchase
- `/profile` - User profile

#### Theme (`core/theme/`)

| File | ဖော်ပြချက် |
|------|-----------|
| `app_theme.dart` | Light/Dark theme data |
| `app_colors.dart` | Color palette |

**Color Palette:**
```dart
// Primary: Violet (#8B5CF6) → Pink (#EC4899) gradient
// Dark Background: #0A0A0A
// Light Background: #FFFFFF
```

#### L10n (`core/l10n/`)

| Feature | ဖော်ပြချက် |
|---------|-----------|
| `app_strings.dart` | Localized strings |
| Myanmar locale | မြန်မာဘာသာ support |

---

### Feature Modules (`lib/features/`)

#### 🔐 Auth Feature (`features/auth/`)

```
auth/
├── data/
│   ├── models/         # Auth models
│   └── repositories/   # Auth repository
├── domain/
│   └── entities/       # User entity
└── presentation/
    ├── providers/      # Auth providers
    └── screens/        # Login, Register screens
```

**Screens:**
- `LoginScreen` - Email/Password login, Google Sign-In
- `RegisterScreen` - User registration
- `ForgotPasswordScreen` - Password reset

#### 🎬 Video Creation Feature (`features/video_creation/`)

```
video_creation/
├── data/
│   ├── models/         # Video models
│   └── repositories/   # Video repository
├── domain/
│   └── entities/       # Video entity
└── presentation/
    ├── providers/      # Video providers
    ├── screens/        # Creation screens
    └── widgets/        # Creation widgets
```

**Widgets (11):**
- URL input
- Voice selector
- Style selector
- Script editor
- Live preview
- Progress indicator
- Settings panel
- Submit button
- ... နောက်ထပ်

#### 📹 Videos Feature (`features/videos/`)

```
videos/
├── data/
│   └── repositories/
└── presentation/
    ├── providers/
    ├── screens/
    │   ├── videos_list_screen.dart
    │   └── video_detail_screen.dart
    └── widgets/
        └── video_card.dart
```

#### 💰 Credits Feature (`features/credits/`)

```
credits/
├── data/
└── presentation/
    ├── screens/
    │   └── credits_screen.dart
    └── widgets/
        └── credit_package_card.dart
```

#### 👤 Profile Feature (`features/profile/`)

```
profile/
├── data/
└── presentation/
    ├── screens/
    │   ├── profile_screen.dart
    │   ├── settings_screen.dart
    │   └── order_history_screen.dart
    └── widgets/
```

#### 🏠 Home Feature (`features/home/`)

```
home/
└── presentation/
    ├── screens/
    │   └── home_screen.dart
    └── widgets/
        └── quick_action_card.dart
```

---

## 🔧 Tech Stack အသေးစိတ်

### Backend Dependencies (requirements.txt)

| Category | Packages |
|----------|----------|
| **Framework** | FastAPI 0.109, Uvicorn |
| **Database** | SQLAlchemy 2.0, Alembic, asyncpg |
| **Cache/Queue** | Redis 5.0, Celery 5.3, Flower |
| **Auth** | PyJWT 2.8, Passlib, bcrypt |
| **TTS** | Edge-TTS 7.2+, gTTS |
| **Video** | yt-dlp, pytubefix, ffmpeg-python |
| **AI** | google-generativeai, groq, openai, poe-api-wrapper |
| **Email** | Resend |
| **Storage** | boto3 (R2) |

### Frontend Dependencies (package.json)

| Category | Packages |
|----------|----------|
| **Framework** | Next.js 14, React 18 |
| **UI** | Radix UI (15+ components), Tailwind CSS |
| **State** | Zustand 4.4, TanStack React Query 5.17 |
| **Forms** | React Hook Form, Zod |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |

### Mobile Dependencies (pubspec.yaml)

| Category | Packages |
|----------|----------|
| **State** | flutter_riverpod 2.4 |
| **Navigation** | go_router 13.0 |
| **HTTP** | dio 5.4 |
| **Storage** | shared_preferences, flutter_secure_storage |
| **UI** | google_fonts, cached_network_image, shimmer, lottie |
| **Media** | image_picker, video_player |
| **Firebase** | firebase_core |

---

## 📁 Complete File Structure

### Root Level

```
RecapVideo-Ai_Project_in-VScode/
├── .agent/                 # Agent workflows
├── .env.example           # Environment template
├── .git/                  # Git repository
├── .github/               # GitHub workflows
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── backend/              # FastAPI backend
├── development_status/   # Development notes
├── docker/               # Docker files
├── docker-compose.yml    # Production compose
├── docker-compose.workers.yml  # Worker compose
├── docs/                 # Documentation
├── frontend/             # Next.js frontend
├── mobile-app/           # Flutter mobile app
└── update_prompt.sql     # Database updates
```

---

## 🎯 နိဂုံးချုပ်

RecapVideo.AI v3 သည် well-structured, production-ready project ဖြစ်ပြီး:

1. **Backend**: FastAPI ဖြင့် async, type-safe API
2. **Frontend**: Next.js 14 ဖြင့် modern React UI
3. **Mobile**: Flutter ဖြင့် cross-platform app
4. **Processing**: FFmpeg + Edge-TTS ဖြင့် video generation
5. **Security**: JWT auth, rate limiting, token blacklist
6. **Payment**: Credit-based system with Telegram approval

---

*Document generated: 2026-01-18*
*RecapVideo.AI Team*
