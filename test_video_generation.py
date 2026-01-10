#!/usr/bin/env python3
"""
Video Generation Test Script
Edge-TTS 7.2.7 နဲ့ yt-dlp 2025.12.8 အလုပ်လုပ်မလုပ် test လုပ်မယ်
"""

import requests
import time
import json

# Server configuration
BASE_URL = "http://209.46.123.52:8000"

def test_video_generation():
    """Test video generation with a short YouTube video"""
    
    print("=" * 60)
    print("🎬 RecapVideo - Video Generation Test")
    print("=" * 60)
    
    # Test with a short video (under 5 minutes for quick test)
    test_data = {
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Short test video
        "target_language": "my",  # Myanmar/Burmese
        "voice_id": "en-US-AriaNeural",  # Edge-TTS voice
        "video_style": "recap"
    }
    
    print(f"\n📝 Test Configuration:")
    print(f"   YouTube URL: {test_data['youtube_url']}")
    print(f"   Target Language: {test_data['target_language']}")
    print(f"   Voice: {test_data['voice_id']}")
    
    # Step 1: Check API health
    print("\n🔍 Step 1: Checking API health...")
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=10)
        if health_response.status_code == 200:
            print("   ✅ API is healthy")
        else:
            print(f"   ❌ API health check failed: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Cannot connect to API: {e}")
        return False
    
    # Step 2: Check worker status
    print("\n🔍 Step 2: Checking Celery workers...")
    try:
        # Try to get worker status if endpoint exists
        worker_response = requests.get(f"{BASE_URL}/api/v1/admin/workers", timeout=10)
        if worker_response.status_code == 200:
            workers = worker_response.json()
            print(f"   ✅ Workers active: {workers}")
        else:
            print("   ⚠️ Worker status endpoint not available (may need auth)")
    except Exception as e:
        print(f"   ⚠️ Worker check skipped: {e}")
    
    # Step 3: Submit video generation task
    print("\n🚀 Step 3: Submitting video generation task...")
    try:
        # First, we need to login or use API key
        # For testing, let's try the public endpoint
        response = requests.post(
            f"{BASE_URL}/api/v1/videos/generate",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 401:
            print("   ⚠️ Authentication required - trying guest mode...")
            # Try without auth for demo
            response = requests.post(
                f"{BASE_URL}/api/v1/demo/generate",
                json=test_data,
                timeout=30
            )
        
        if response.status_code in [200, 201, 202]:
            result = response.json()
            task_id = result.get('task_id') or result.get('id')
            print(f"   ✅ Task submitted! ID: {task_id}")
            
            # Step 4: Monitor task progress
            print("\n⏳ Step 4: Monitoring task progress...")
            for i in range(60):  # Wait up to 5 minutes
                time.sleep(5)
                
                status_response = requests.get(
                    f"{BASE_URL}/api/v1/videos/status/{task_id}",
                    timeout=10
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    state = status.get('status') or status.get('state')
                    progress = status.get('progress', 0)
                    
                    print(f"   [{i*5}s] Status: {state}, Progress: {progress}%")
                    
                    if state == 'SUCCESS' or state == 'completed':
                        print("\n   ✅ VIDEO GENERATION SUCCESSFUL!")
                        print(f"   📹 Video URL: {status.get('video_url')}")
                        return True
                    elif state == 'FAILURE' or state == 'failed':
                        print(f"\n   ❌ Task failed: {status.get('error')}")
                        return False
                else:
                    print(f"   ⚠️ Status check failed: {status_response.status_code}")
            
            print("\n   ⏰ Timeout - task still processing")
            return False
            
        else:
            print(f"   ❌ Task submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_edge_tts_direct():
    """Test Edge-TTS directly on server"""
    print("\n" + "=" * 60)
    print("🔊 Testing Edge-TTS directly on server...")
    print("=" * 60)
    
    import subprocess
    
    # Run test command on server
    cmd = '''ssh root@209.46.123.52 "docker exec recapvideo-worker-video-1 python -c \\"
import asyncio
import edge_tts

async def test():
    text = 'Hello, this is a test of Edge TTS version 7.2.7'
    voice = 'en-US-AriaNeural'
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save('/tmp/test_tts.mp3')
    print('TTS Success! File saved.')

asyncio.run(test())
\\""'''
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        if 'TTS Success' in result.stdout:
            print("   ✅ Edge-TTS is working!")
            return True
        else:
            print(f"   ❌ Edge-TTS failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_ytdlp_direct():
    """Test yt-dlp directly on server"""
    print("\n" + "=" * 60)
    print("📥 Testing yt-dlp directly on server...")
    print("=" * 60)
    
    import subprocess
    
    # Test yt-dlp with impersonation
    cmd = '''ssh root@209.46.123.52 "docker exec recapvideo-worker-video-1 yt-dlp --version && docker exec recapvideo-worker-video-1 yt-dlp -F --impersonate chrome 'https://www.youtube.com/watch?v=jNQXAC9IVRw' 2>&1 | head -20"'''
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
        print(result.stdout)
        if result.returncode == 0 or 'format' in result.stdout.lower():
            print("   ✅ yt-dlp is working!")
            return True
        else:
            print(f"   ⚠️ yt-dlp output: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n🧪 Starting RecapVideo Component Tests...\n")
    
    # Test 1: Edge-TTS
    tts_ok = test_edge_tts_direct()
    
    # Test 2: yt-dlp
    ytdlp_ok = test_ytdlp_direct()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"   Edge-TTS 7.2.7: {'✅ PASS' if tts_ok else '❌ FAIL'}")
    print(f"   yt-dlp 2025.12.8: {'✅ PASS' if ytdlp_ok else '❌ FAIL'}")
    print("=" * 60)
    
    if tts_ok and ytdlp_ok:
        print("\n🎉 All components working! Ready for video generation.")
    else:
        print("\n⚠️ Some components need attention.")
