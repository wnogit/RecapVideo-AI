#!/usr/bin/env python3
"""Check video status"""
import requests

BASE_URL = "http://localhost:8000/api/v1"
VIDEO_ID = "655a9778-3228-44e4-9e39-fa5c92b17e9c"

print("Logging in...")
response = requests.post(
    BASE_URL + "/auth/login",
    json={"email": "xunn.info@gmail.com", "password": "Anni270915#"}
)

if response.status_code == 200:
    data = response.json()
    token = data.get("access_token", "")
    headers = {"Authorization": "Bearer " + token}
    
    # Get video status
    print(f"\nChecking video {VIDEO_ID}...")
    video_response = requests.get(
        BASE_URL + "/videos/" + VIDEO_ID,
        headers=headers
    )
    print("Status code:", video_response.status_code)
    if video_response.status_code == 200:
        video = video_response.json()
        print("Video status:", video.get("status"))
        print("Progress:", video.get("progress_percent"), "%")
        print("Error:", video.get("error_message"))
        print("Output URL:", video.get("output_video_url"))
    else:
        print("Response:", video_response.text[:500])
else:
    print("Login failed:", response.text)
