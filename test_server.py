#!/usr/bin/env python3
"""Test video creation - run on server"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"
TEST_VIDEO_URL = "https://www.youtube.com/shorts/BQMhRYSV4Fk"

print("Logging in...")
response = requests.post(
    BASE_URL + "/auth/login",
    json={"email": "xunn.info@gmail.com", "password": "Anni270915#"}
)

if response.status_code == 200:
    data = response.json()
    token = data.get("access_token", "")
    headers = {"Authorization": "Bearer " + token}
    
    # Check credits first
    me = requests.get(BASE_URL + "/users/me", headers=headers)
    if me.status_code == 200:
        user = me.json()
        print(f"User: {user.get('email')}")
        print(f"Credits: {user.get('credit_balance')}")
    
    # Create video
    print(f"\nCreating video from: {TEST_VIDEO_URL}")
    video_response = requests.post(
        BASE_URL + "/videos",
        headers=headers,
        json={"source_url": TEST_VIDEO_URL}
    )
    print(f"Create status: {video_response.status_code}")
    
    if video_response.status_code == 201:
        video_data = video_response.json()
        video_id = video_data.get("id")
        print(f"Video ID: {video_id}")
        print(f"Initial status: {video_data.get('status')}")
        
        # Poll for status updates
        print("\nPolling for status updates...")
        for i in range(60):  # Max 3 minutes
            time.sleep(3)
            status_response = requests.get(
                BASE_URL + "/videos/" + video_id,
                headers=headers
            )
            if status_response.status_code == 200:
                video = status_response.json()
                status = video.get("status")
                progress = video.get("progress_percent", 0)
                print(f"  [{i+1}] Status: {status}, Progress: {progress}%")
                
                if status == "completed":
                    print("\n✅ VIDEO COMPLETED!")
                    print(f"Output URL: {video.get('output_video_url')}")
                    break
                elif status == "failed":
                    print(f"\n❌ VIDEO FAILED: {video.get('error_message')}")
                    break
    else:
        print(f"Error: {video_response.text[:500]}")
else:
    print("Login failed:", response.text)
