# RecapVideo.AI - Deployment Guide

> Production deployment guide for RecapVideo.AI v3

---

## 🖥️ Server Requirements

### Recommended Specs
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 100 GB SSD | 500+ GB NVMe |
| OS | Ubuntu 22.04 | Ubuntu 22.04 LTS |

### Required Software
- Docker 24+
- Docker Compose 2.20+
- Nginx (for reverse proxy)
- Certbot (for SSL)

---

## 🚀 Deployment Steps

### 1. Clone Repository

```bash
cd /opt
git clone https://github.com/wnogit/RecapVideo-AI.git
cd RecapVideo-AI/recapvideo-v3
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local
```

**Important `.env` settings:**
```env
# MUST CHANGE IN PRODUCTION
JWT_SECRET_KEY=generate-a-long-random-string-here
ENVIRONMENT=production

# Database (use strong password)
DATABASE_URL=postgresql+asyncpg://recapvideo:STRONG_PASSWORD@postgres:5432/recapvideo

# External services
GEMINI_API_KEY=your-key
TRANSCRIPT_API_KEY=your-key
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# Telegram notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id
```

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Run Database Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Configure Nginx

Create `/etc/nginx/sites-available/recapvideo`:

```nginx
# API Backend
server {
    listen 80;
    server_name api.recapvideo.ai;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for video processing
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # File upload size
    client_max_body_size 50M;
}

# Frontend
server {
    listen 80;
    server_name studio.recapvideo.ai recapvideo.ai www.recapvideo.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/recapvideo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.recapvideo.ai -d studio.recapvideo.ai -d recapvideo.ai -d www.recapvideo.ai
```

---

## 🔧 Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# All
docker-compose restart

# Specific
docker-compose restart backend
```

### Update Application
```bash
cd /opt/RecapVideo-AI/recapvideo-v3
git pull origin main
docker-compose up -d --build
docker-compose exec backend alembic upgrade head
```

### Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U recapvideo recapvideo > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U recapvideo recapvideo
```

### Clear Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

---

## 📊 Monitoring

### Check Container Resources
```bash
docker stats
```

### Check Disk Usage
```bash
df -h
docker system df
```

### Clean Unused Docker Resources
```bash
docker system prune -a
```

---

## 🔒 Security Checklist

- [ ] Change default JWT secret key
- [ ] Use strong database password
- [ ] Enable firewall (only 80, 443, 22)
- [ ] Setup SSL certificates
- [ ] Configure rate limiting
- [ ] Enable fail2ban
- [ ] Regular security updates

### Firewall Setup
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database connection failed: Check DATABASE_URL
# - Missing env vars: Check .env file
# - Port already in use: Check other services
```

### Database Connection Issues
```bash
# Check if postgres is running
docker-compose ps postgres

# Connect manually
docker-compose exec postgres psql -U recapvideo -d recapvideo
```

### Video Processing Fails
```bash
# Check temp directory permissions
ls -la /tmp/recapvideo/

# Check FFmpeg
docker-compose exec backend ffmpeg -version

# Check worker logs
docker-compose logs celery_worker
```

---

## 📈 Scaling

For high traffic, consider:

1. **Multiple Backend Workers**
```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
```

2. **Separate Celery Workers**
```bash
docker-compose -f docker-compose.yml -f docker-compose.workers.yml up -d
```

3. **External Database**
   - Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)

4. **CDN for Static Files**
   - Configure Cloudflare R2 with CDN
