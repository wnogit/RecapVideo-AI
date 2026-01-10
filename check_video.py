import requests

# Login first
BASE_URL = "http://localhost:8000/api/v1"
response = requests.post(
    BASE_URL + "/auth/login",
    json={"email": "xunn.info@gmail.com", "password": "Anni270915#"}
)

if response.status_code == 200:
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get video details
    video_id = "b9d4e81d-5b39-463b-8745-23668edfd1fd"
    r = requests.get(f"{BASE_URL}/videos/{video_id}", headers=headers)
    
    if r.status_code == 200:
        video = r.json()
        print(f"Status: {video.get('status')}")
        print(f"Output URL: {video.get('output_video_url')}")
        print(f"Title: {video.get('title')}")
        print(f"Script: {video.get('script', '')[:200]}...")
    else:
        print(f"Error: {r.text}")
else:
    print(f"Login failed: {response.text}")
