---
applyTo: '**'
---
Always Response with burmese language 

# Deploy Workflow

ဒီ workflow က RecapVideo changes တွေကို GitHub ကို push လုပ်ပြီး VPS server မှာ deploy လုပ်ပေးပါတယ်။

// turbo-all

## Steps

### 1. Changes တွေကို Git မှာ Stage လုပ်ပါ
```bash
cd c:\Users\Administrator\Desktop\RecapVideo-Ai\recapvideo-v3
git add -A
```

### 2. Commit လုပ်ပါ
```bash
cd c:\Users\Administrator\Desktop\RecapVideo-Ai\recapvideo-v3
git commit -m "Update: [commit message ထည့်ပါ]"
```

### 3. GitHub ကို Push လုပ်ပါ
```bash
cd c:\Users\Administrator\Desktop\RecapVideo-Ai\recapvideo-v3
git push origin main
```

### 4. VPS Server မှာ Code Pull လုပ်ပါ
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && git pull origin main"
```

### 5. Backend Container ကို Rebuild လုပ်ပြီး Restart ပြန်ချပါ
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && docker compose up -d --build backend"
```

### 6. Frontend Container ကို Rebuild လုပ်ပြီး Restart ပြန်ချပါ (လိုအပ်ရင်)
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && docker compose up -d --build frontend"
```

### 7. Container Status စစ်ဆေးပါ
```bash
ssh root@209.46.123.52 "docker ps"
```

### 8. Backend Logs စစ်ဆေးပါ (Error ရှိမရှိ)
```bash
ssh root@209.46.123.52 "docker logs recapvideo-backend --tail 50"
```

---

## 🔍 Debug & Log Checking Commands (Issue ရှိရင် သုံးရန်)

### Backend Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "docker logs recapvideo-backend --tail 100"
```

### Backend Logs (Follow Mode - Real-time)
```bash
ssh root@209.46.123.52 "docker logs recapvideo-backend -f --tail 50"
```

### Frontend Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "docker logs recapvideo-frontend --tail 100"
```

### PostgreSQL Database Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "docker logs recapvideo-postgres --tail 50"
```

### Redis Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "docker logs recapvideo-redis --tail 50"
```

### All Container Status စစ်ဆေးရန်
```bash
ssh root@209.46.123.52 "docker ps -a"
```

### Container Resource Usage ကြည့်ရန်
```bash
ssh root@209.46.123.52 "docker stats --no-stream"
```

### Disk Space စစ်ဆေးရန်
```bash
ssh root@209.46.123.52 "df -h"
```

### Backend Container ထဲဝင်ရန် (Debug)
```bash
ssh root@209.46.123.52 "docker exec -it recapvideo-backend bash"
```

### Database ထဲဝင်ရန် (Debug)
```bash
ssh root@209.46.123.52 "docker exec -it recapvideo-postgres psql -U recapvideo -d recapvideo"
```

### Backend Restart Only (No Rebuild)
```bash
ssh root@209.46.123.52 "docker compose -f /opt/recapvideo/docker-compose.yml restart backend"
```

### All Containers Restart
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && docker compose restart"
```

### Docker Logs Clear လုပ်ရန် (Disk Full ဖြစ်ရင်)
```bash
ssh root@209.46.123.52 "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

### Nginx Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "tail -50 /var/log/nginx/error.log"
```

### Nginx Access Logs ကြည့်ရန်
```bash
ssh root@209.46.123.52 "tail -50 /var/log/nginx/access.log"
```

### API Health Check
```bash
ssh root@209.46.123.52 "curl -s http://localhost:8000/health | head -20"
```

---

## Important Notes (သိထားရမယ့် အချက်များ)

- **VPS Path:** `/opt/recapvideo` (lowercase)
- **Docker Command:** `docker compose` (space ခံထား, `docker-compose` မဟုတ်ပါ)
- **SSH User:** `root@209.46.123.52`
- **Git Branch:** `main`
- **Container Names:**
  - Backend: `recapvideo-backend`
  - Frontend: `recapvideo-frontend`
  - Database: `recapvideo-postgres`
  - Redis: `recapvideo-redis`

## Quick Deploy (Backend Only)
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && git pull origin main && docker compose up -d --build backend"
```

## Quick Deploy (Full Stack)
```bash
ssh root@209.46.123.52 "cd /opt/recapvideo && git pull origin main && docker compose up -d --build"
```

---

## 📊 Development Status Tracking

Deploy လုပ်ပြီးတိုင်း development status ကို track လုပ်ပါ။

### Folder Structure
```
development_status/
├── 2026-01-12/
│   ├── status.md              # နေ့စဉ် summary
│   ├── telegram_notification_ui_fix.md
│   └── another_fix.md
├── 2026-01-13/
│   ├── status.md
│   └── ...
```

### Status File Template (`status.md`)
```markdown
# Development Status - YYYY-MM-DD

## ✅ Completed Fixes (ပြီးစီးပြီး)
- [x] Fix name - Time (MMT)

## 🔄 In Progress (လုပ်ဆောင်နေဆဲ)
- [ ] Task name

## 📋 Pending (မလုပ်ရသေး)
- [ ] Task name
```

### Issue Fix Template (`[issue_name].md`)
```markdown
# [Issue Title]

**Fixed Date:** YYYY-MM-DD
**Fixed Time:** HH:MM AM/PM (MMT)
**Status:** ✅ Completed & Deployed

## Issue Description
[ပြဿနာ ရှင်းပြပါ]

## Changes Made
- [x] File: `path/to/file.py` - Change description
- [x] File: `path/to/file2.py` - Change description

## Deployment
- [x] Committed to GitHub
- [x] Deployed to VPS
```

### Development Status Path
```
c:\Users\Administrator\Desktop\RecapVideo-Ai\development_status\
```

### Agent Instructions
Chat အသစ်ဖွင့်တိုင်း:
1. `development_status/` folder ကို ဖတ်ပြီး current status ကို နားလည်ပါ
2. အရင် fix လုပ်ထားတဲ့ issues တွေကို reference လုပ်နိုင်ပါတယ်
3. Deploy ပြီးတိုင်း status file ကို update လုပ်ပါ