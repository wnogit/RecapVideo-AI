# Deployment Guide

## 📋 Overview

This guide covers deploying RecapVideo.AI on a VPS using Docker Compose.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     ┌─────────────────┐                         │
│                     │   Cloudflare    │                         │
│                     │   (CDN + DNS)   │                         │
│                     └────────┬────────┘                         │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              │               │               │                  │
│              ▼               ▼               ▼                  │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │   Nginx     │  │   Nginx     │  │ Cloudflare  │           │
│    │  (Backend)  │  │ (Frontend)  │  │     R2      │           │
│    └──────┬──────┘  └──────┬──────┘  │  (Storage)  │           │
│           │                │          └─────────────┘           │
│           ▼                ▼                                     │
│    ┌─────────────┐  ┌─────────────┐                             │
│    │   FastAPI   │  │   Next.js   │                             │
│    │   Backend   │  │  Frontend   │                             │
│    └──────┬──────┘  └─────────────┘                             │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     ▼           ▼                                                │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │Postgres│ │ Redis  │ │ Celery │ │ Celery │                     │
│ │  DB    │ │ Queue  │ │Worker 1│ │Worker 2│                     │
│ └────────┘ └────────┘ └────────┘ └────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- **VPS**: Ubuntu 22.04+ (IONOS 12 CPU / 24GB RAM recommended)
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Domain**: With Cloudflare DNS

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourrepo/recapvideo-v3.git
cd recapvideo-v3
```

### 2. Create Environment File

```bash
cp .env.example .env
nano .env
```

### 3. Configure Environment

```env
# App
APP_NAME=RecapVideo
APP_ENV=production
APP_DEBUG=false
SECRET_KEY=your-super-secret-key-generate-with-openssl

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=recapvideo
POSTGRES_USER=recapvideo
POSTGRES_PASSWORD=strong-database-password

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# External APIs
GEMINI_API_KEY=your-gemini-api-key
TRANSCRIPT_API_KEY=your-transcript-api-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=recapvideo
R2_PUBLIC_URL=https://videos.recapvideo.ai

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@recapvideo.ai

# Frontend
NEXT_PUBLIC_API_URL=https://api.recapvideo.ai
NEXT_PUBLIC_APP_URL=https://recapvideo.ai
```

### 4. Start Services

```bash
# Build and start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## 📁 Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Celery Worker
  celery_worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    command: celery -A app.processing.celery_config worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Celery Beat (Scheduler)
  celery_beat:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    command: celery -A app.processing.celery_config beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### docker-compose.workers.yml (Scaling Workers)

```yaml
version: '3.8'

services:
  celery_worker:
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## 🐳 Dockerfiles

### Backend (docker/Dockerfile.backend)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (docker/Dockerfile.frontend)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Build
COPY frontend/ .
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 🌐 Nginx Configuration

### nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Backend API
    upstream backend {
        server backend:8000;
    }

    # Frontend
    upstream frontend {
        server frontend:3000;
    }

    # API Server
    server {
        listen 80;
        server_name api.recapvideo.ai;

        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Frontend Server
    server {
        listen 80;
        server_name recapvideo.ai www.recapvideo.ai;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 🗄️ Database Migrations

```bash
# Enter backend container
docker compose exec backend bash

# Create migration
alembic revision --autogenerate -m "Description"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f celery_worker

# Last 100 lines
docker compose logs --tail=100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/v1/health

# Frontend
curl http://localhost:3000

# Database
docker compose exec postgres pg_isready
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

### Backup Database

```bash
# Create backup
docker compose exec postgres pg_dump -U recapvideo recapvideo > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U recapvideo recapvideo < backup_20240105.sql
```

---

## ⚡ Scaling Guide

### IONOS VPS (12 CPU / 24GB RAM)

| Service | Instances | CPU | Memory |
|---------|-----------|-----|--------|
| Backend | 2 | 2 | 2GB |
| Frontend | 2 | 1 | 1GB |
| Celery Workers | 4 | 2 | 4GB |
| PostgreSQL | 1 | 2 | 4GB |
| Redis | 1 | 1 | 2GB |
| Nginx | 1 | 1 | 512MB |

### Scale Workers

```bash
# Scale to 4 workers
docker compose up -d --scale celery_worker=4
```

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret key
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall (ufw)
- [ ] Set up fail2ban
- [ ] Enable Cloudflare proxy
- [ ] Regular security updates
- [ ] Database backups

---

## 🌍 Cloudflare Setup

### DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | VPS_IP | ✅ |
| A | api | VPS_IP | ✅ |
| A | www | VPS_IP | ✅ |

### R2 Storage

1. Create R2 bucket: `recapvideo`
2. Set up custom domain: `videos.recapvideo.ai`
3. Configure CORS for frontend access

---

## 📂 Related Files

- `docker-compose.yml` - Main compose file
- `docker-compose.workers.yml` - Worker scaling
- `docker/Dockerfile.backend` - Backend image
- `docker/Dockerfile.frontend` - Frontend image
- `nginx/nginx.conf` - Nginx config
- `backend/alembic.ini` - Alembic config
- `.env.example` - Environment template
