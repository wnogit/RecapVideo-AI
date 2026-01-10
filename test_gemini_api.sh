#!/bin/bash
export GEMINI_API_KEY="AIzaSyCRu7z0zouIKHxH_ziIbPxXXhYC9_aUR5s"
docker exec -e GEMINI_API_KEY="$GEMINI_API_KEY" recapvideo-worker-video-1 python3 -c "
import google.generativeai as genai
import os
import warnings
warnings.filterwarnings('ignore')

api_key = os.environ.get('GEMINI_API_KEY')
print(f'API Key starts with: {api_key[:15]}...')

genai.configure(api_key=api_key)

print('Listing available models:')
for m in genai.list_models():
    methods = [str(x) for x in m.supported_generation_methods]
    if 'generateContent' in methods:
        print(f'  - {m.name}')

print()
print('Testing gemini-1.5-flash...')
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content('Say hello in 3 words')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Error: {e}')
"
