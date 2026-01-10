#!/bin/bash
docker exec recapvideo-postgres psql -U recapvideo -d recapvideo -t -A -c "SELECT key_value FROM api_keys WHERE key_type='gemini' LIMIT 1"
