import google.generativeai as genai
import asyncpg
import asyncio
import os

async def main():
    # Try to connect to postgres, fallback to env var
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        try:
            conn = await asyncpg.connect(
                host='postgres',
                port=5432,
                user='recapvideo',
                password='recapvideo',
                database='recapvideo'
            )
            row = await conn.fetchrow("SELECT key_value FROM api_keys WHERE key_type = 'gemini'")
            api_key = row['key_value']
            await conn.close()
        except Exception as e:
            print(f'DB connection failed: {e}')
            return
    
    print(f'API Key starts with: {api_key[:15]}...')
    
    genai.configure(api_key=api_key)
    
    print('Listing available models:')
    for m in genai.list_models():
        if 'generateContent' in [str(x) for x in m.supported_generation_methods]:
            print(f'  - {m.name}')
    
    print('\nTesting gemini-1.5-flash...')
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content('Say hello in 3 words')
    print(f'Response: {response.text}')

asyncio.run(main())
