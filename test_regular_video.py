import requests
import time

BASE_URL = 'http://localhost:8000/api/v1'
email = 'xunn.info@gmail.com'
password = 'Anni270915#'

# Login
login_resp = requests.post(f'{BASE_URL}/auth/login', json={'email': email, 'password': password})
token = login_resp.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Test with regular YouTube video (10 sec clip)
video_url = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
resp = requests.post(f'{BASE_URL}/videos/create', json={
    'youtube_url': video_url,
    'language': 'en',
    'voice_gender': 'female'
}, headers=headers)

print(f'Create: {resp.status_code}')
if resp.status_code == 201:
    video_id = resp.json()['id']
    print(f'Video ID: {video_id}')
    
    for i in range(20):
        time.sleep(5)
        status_resp = requests.get(f'{BASE_URL}/videos/{video_id}', headers=headers)
        data = status_resp.json()
        status = data.get('status')
        progress = data.get('progress')
        print(f'[{i+1}] {status}: {progress}%')
        if status in ['completed', 'failed']:
            if data.get('error_message'):
                print(f'Error: {data.get("error_message")}')
            if data.get('video_url'):
                print(f'SUCCESS! Video URL: {data.get("video_url")}')
            break
else:
    print(f'Error: {resp.text}')
