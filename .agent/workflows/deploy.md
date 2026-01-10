---
description: Deploy RecapVideo changes to GitHub and VPS
---

# Deploy Workflow for RecapVideo.AI

This workflow handles git push and VPS deployment for RecapVideo project.

## Steps

// turbo-all

1. Stage all changes
```bash
git add -A
```

2. Commit changes with message
```bash
git commit -m "fix: update changes"
```

3. Push to GitHub
```bash
git push origin main
```

4. SSH to VPS and pull changes
```bash
ssh -o StrictHostKeyChecking=no root@209.46.123.52 "cd /opt/recapvideo && git pull origin main"
```

5. Rebuild and restart Docker containers
```bash
ssh -o StrictHostKeyChecking=no root@209.46.123.52 "cd /opt/recapvideo && docker compose down && docker compose up -d --build"
```

6. Verify containers are running
```bash
ssh -o StrictHostKeyChecking=no root@209.46.123.52 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```
