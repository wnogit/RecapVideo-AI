#!/usr/bin/env python3
"""
YouTube Video Download Test Script
All possible methods to download YouTube videos
Run locally to test which method works
"""

import asyncio
import subprocess
import json
import os
import sys
from pathlib import Path
import tempfile
import time

# Test video - short video for quick testing
TEST_VIDEO_ID = "jNQXAC9IVRw"  # "Me at the zoo" - first YouTube video
TEST_URL = f"https://www.youtube.com/watch?v={TEST_VIDEO_ID}"

# Output directory
OUTPUT_DIR = Path(tempfile.gettempdir()) / "youtube_test"
OUTPUT_DIR.mkdir(exist_ok=True)

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{'='*60}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_fail(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warn(text):
    print(f"{Colors.YELLOW}⚠️ {text}{Colors.RESET}")

results = {}

# ============================================================
# METHOD 1: yt-dlp CLI with various strategies
# ============================================================
def test_ytdlp_cli():
    """Test yt-dlp CLI with different strategies"""
    print_header("METHOD 1: yt-dlp CLI")
    
    strategies = [
        {
            "name": "Default (no options)",
            "args": []
        },
        {
            "name": "Android client",
            "args": ["--extractor-args", "youtube:player_client=android"]
        },
        {
            "name": "iOS client",
            "args": ["--extractor-args", "youtube:player_client=ios"]
        },
        {
            "name": "TV client",
            "args": ["--extractor-args", "youtube:player_client=tv"]
        },
        {
            "name": "mweb client",
            "args": ["--extractor-args", "youtube:player_client=mweb"]
        },
        {
            "name": "web_safari client",
            "args": ["--extractor-args", "youtube:player_client=web_safari"]
        },
        {
            "name": "mediaconnect client",
            "args": ["--extractor-args", "youtube:player_client=mediaconnect"]
        },
        {
            "name": "Chrome impersonate",
            "args": ["--impersonate", "chrome"]
        },
        {
            "name": "Safari impersonate",
            "args": ["--impersonate", "safari"]
        },
        {
            "name": "Android + Chrome impersonate",
            "args": ["--extractor-args", "youtube:player_client=android", "--impersonate", "chrome"]
        },
        {
            "name": "Force IPv4",
            "args": ["--force-ipv4"]
        },
        {
            "name": "Geo bypass",
            "args": ["--geo-bypass"]
        },
        {
            "name": "No check certificate",
            "args": ["--no-check-certificate"]
        },
        {
            "name": "Sleep interval",
            "args": ["--sleep-interval", "1", "--max-sleep-interval", "3"]
        },
    ]
    
    for strategy in strategies:
        output_file = str(OUTPUT_DIR / f"test_{strategy['name'].replace(' ', '_')}.mp4")
        
        cmd = [
            "yt-dlp",
            "-f", "worst",  # smallest file for quick test
            "-o", output_file,
            "--no-playlist",
            *strategy["args"],
            TEST_URL
        ]
        
        print(f"\n📌 Testing: {strategy['name']}")
        print(f"   Command: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0 and Path(output_file).exists():
                size = Path(output_file).stat().st_size
                print_success(f"Downloaded! Size: {size/1024:.1f} KB")
                results[f"ytdlp_cli_{strategy['name']}"] = True
                Path(output_file).unlink()  # Clean up
                return True  # Found working method
            else:
                error = result.stderr[:200] if result.stderr else "Unknown error"
                print_fail(f"Failed: {error}")
                results[f"ytdlp_cli_{strategy['name']}"] = False
                
        except subprocess.TimeoutExpired:
            print_fail("Timeout")
            results[f"ytdlp_cli_{strategy['name']}"] = False
        except Exception as e:
            print_fail(f"Error: {e}")
            results[f"ytdlp_cli_{strategy['name']}"] = False
    
    return False

# ============================================================
# METHOD 2: yt-dlp Python Library
# ============================================================
def test_ytdlp_python():
    """Test yt-dlp as Python library"""
    print_header("METHOD 2: yt-dlp Python Library")
    
    try:
        import yt_dlp
    except ImportError:
        print_fail("yt-dlp not installed. Run: pip install yt-dlp")
        results["ytdlp_python"] = False
        return False
    
    strategies = [
        {
            "name": "Default",
            "opts": {}
        },
        {
            "name": "Android client",
            "opts": {"extractor_args": {"youtube": {"player_client": ["android"]}}}
        },
        {
            "name": "iOS client",
            "opts": {"extractor_args": {"youtube": {"player_client": ["ios"]}}}
        },
        {
            "name": "TV client",
            "opts": {"extractor_args": {"youtube": {"player_client": ["tv"]}}}
        },
        {
            "name": "mweb client",
            "opts": {"extractor_args": {"youtube": {"player_client": ["mweb"]}}}
        },
        {
            "name": "Multiple clients",
            "opts": {"extractor_args": {"youtube": {"player_client": ["android", "ios", "tv"]}}}
        },
    ]
    
    for strategy in strategies:
        output_file = str(OUTPUT_DIR / f"pylib_{strategy['name'].replace(' ', '_')}.mp4")
        
        ydl_opts = {
            'format': 'worst',
            'outtmpl': output_file,
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            **strategy['opts']
        }
        
        print(f"\n📌 Testing: {strategy['name']}")
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([TEST_URL])
            
            if Path(output_file).exists():
                size = Path(output_file).stat().st_size
                print_success(f"Downloaded! Size: {size/1024:.1f} KB")
                results[f"ytdlp_python_{strategy['name']}"] = True
                Path(output_file).unlink()
                return True
            else:
                print_fail("File not created")
                results[f"ytdlp_python_{strategy['name']}"] = False
                
        except Exception as e:
            error = str(e)[:200]
            print_fail(f"Error: {error}")
            results[f"ytdlp_python_{strategy['name']}"] = False
    
    return False

# ============================================================
# METHOD 3: pytube Library
# ============================================================
def test_pytube():
    """Test pytube library"""
    print_header("METHOD 3: pytube Library")
    
    try:
        from pytube import YouTube
    except ImportError:
        print_warn("pytube not installed. Run: pip install pytube")
        results["pytube"] = "not_installed"
        return False
    
    print(f"\n📌 Testing pytube download")
    
    try:
        yt = YouTube(TEST_URL)
        stream = yt.streams.filter(progressive=True).order_by('resolution').first()
        
        if stream:
            output_file = stream.download(output_path=str(OUTPUT_DIR), filename="pytube_test.mp4")
            
            if Path(output_file).exists():
                size = Path(output_file).stat().st_size
                print_success(f"Downloaded! Size: {size/1024:.1f} KB")
                results["pytube"] = True
                Path(output_file).unlink()
                return True
        else:
            print_fail("No stream found")
            results["pytube"] = False
            
    except Exception as e:
        print_fail(f"Error: {e}")
        results["pytube"] = False
    
    return False

# ============================================================
# METHOD 4: pytubefix Library (pytube fork)
# ============================================================
def test_pytubefix():
    """Test pytubefix library (maintained fork of pytube)"""
    print_header("METHOD 4: pytubefix Library")
    
    try:
        from pytubefix import YouTube
    except ImportError:
        print_warn("pytubefix not installed. Run: pip install pytubefix")
        results["pytubefix"] = "not_installed"
        return False
    
    print(f"\n📌 Testing pytubefix download")
    
    try:
        yt = YouTube(TEST_URL)
        stream = yt.streams.filter(progressive=True).order_by('resolution').first()
        
        if stream:
            output_file = stream.download(output_path=str(OUTPUT_DIR), filename="pytubefix_test.mp4")
            
            if Path(output_file).exists():
                size = Path(output_file).stat().st_size
                print_success(f"Downloaded! Size: {size/1024:.1f} KB")
                results["pytubefix"] = True
                Path(output_file).unlink()
                return True
        else:
            print_fail("No stream found")
            results["pytubefix"] = False
            
    except Exception as e:
        print_fail(f"Error: {e}")
        results["pytubefix"] = False
    
    return False

# ============================================================
# METHOD 5: youtube-dl (original)
# ============================================================
def test_youtube_dl():
    """Test youtube-dl (original)"""
    print_header("METHOD 5: youtube-dl (original)")
    
    output_file = str(OUTPUT_DIR / "youtube_dl_test.mp4")
    
    cmd = [
        "youtube-dl",
        "-f", "worst",
        "-o", output_file,
        "--no-playlist",
        TEST_URL
    ]
    
    print(f"\n📌 Testing youtube-dl")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0 and Path(output_file).exists():
            size = Path(output_file).stat().st_size
            print_success(f"Downloaded! Size: {size/1024:.1f} KB")
            results["youtube_dl"] = True
            Path(output_file).unlink()
            return True
        else:
            print_fail(f"Failed: {result.stderr[:200] if result.stderr else 'Unknown error'}")
            results["youtube_dl"] = False
            
    except FileNotFoundError:
        print_warn("youtube-dl not installed")
        results["youtube_dl"] = "not_installed"
    except Exception as e:
        print_fail(f"Error: {e}")
        results["youtube_dl"] = False
    
    return False

# ============================================================
# METHOD 6: Invidious API
# ============================================================
def test_invidious():
    """Test Invidious API"""
    print_header("METHOD 6: Invidious API")
    
    try:
        import requests
    except ImportError:
        print_fail("requests not installed")
        return False
    
    instances = [
        "https://invidious.snopyta.org",
        "https://vid.puffyan.us",
        "https://invidious.kavin.rocks",
        "https://inv.riverside.rocks",
        "https://invidious.osi.kr",
        "https://yt.artemislena.eu",
        "https://invidious.flokinet.to",
        "https://invidious.projectsegfau.lt",
    ]
    
    for instance in instances:
        print(f"\n📌 Testing: {instance}")
        
        try:
            # Get video info
            api_url = f"{instance}/api/v1/videos/{TEST_VIDEO_ID}"
            response = requests.get(api_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                formats = data.get('formatStreams', [])
                
                if formats:
                    # Get first format URL
                    video_url = formats[0].get('url')
                    
                    if video_url:
                        # Download video
                        output_file = OUTPUT_DIR / "invidious_test.mp4"
                        video_response = requests.get(video_url, timeout=30, stream=True)
                        
                        if video_response.status_code == 200:
                            with open(output_file, 'wb') as f:
                                for chunk in video_response.iter_content(chunk_size=8192):
                                    f.write(chunk)
                                    break  # Just download a bit to test
                            
                            if output_file.exists() and output_file.stat().st_size > 0:
                                print_success(f"Working! Format: {formats[0].get('qualityLabel', 'unknown')}")
                                results[f"invidious_{instance}"] = True
                                output_file.unlink()
                                return True
                
                print_fail("No formats found")
            else:
                print_fail(f"Status: {response.status_code}")
                
        except requests.exceptions.Timeout:
            print_fail("Timeout")
        except Exception as e:
            print_fail(f"Error: {str(e)[:100]}")
        
        results[f"invidious_{instance}"] = False
    
    return False

# ============================================================
# METHOD 7: Piped API
# ============================================================
def test_piped():
    """Test Piped API"""
    print_header("METHOD 7: Piped API")
    
    try:
        import requests
    except ImportError:
        print_fail("requests not installed")
        return False
    
    instances = [
        "https://pipedapi.kavin.rocks",
        "https://api.piped.projectsegfau.lt",
        "https://pipedapi.tokhmi.xyz",
        "https://pipedapi.moomoo.me",
        "https://pipedapi.aeong.one",
    ]
    
    for instance in instances:
        print(f"\n📌 Testing: {instance}")
        
        try:
            api_url = f"{instance}/streams/{TEST_VIDEO_ID}"
            response = requests.get(api_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for video streams
                video_streams = data.get('videoStreams', [])
                audio_streams = data.get('audioStreams', [])
                
                if video_streams or audio_streams:
                    stream = video_streams[0] if video_streams else audio_streams[0]
                    video_url = stream.get('url')
                    
                    if video_url:
                        print_success(f"Working! Quality: {stream.get('quality', 'unknown')}")
                        results[f"piped_{instance}"] = True
                        return True
                
                print_fail("No streams found")
            else:
                print_fail(f"Status: {response.status_code}")
                
        except requests.exceptions.Timeout:
            print_fail("Timeout")
        except Exception as e:
            print_fail(f"Error: {str(e)[:100]}")
        
        results[f"piped_{instance}"] = False
    
    return False

# ============================================================
# METHOD 8: Cobalt API
# ============================================================
def test_cobalt():
    """Test Cobalt API"""
    print_header("METHOD 8: Cobalt API")
    
    try:
        import requests
    except ImportError:
        print_fail("requests not installed")
        return False
    
    # Cobalt API v10
    api_url = "https://api.cobalt.tools/"
    
    print(f"\n📌 Testing Cobalt API")
    
    try:
        response = requests.post(
            api_url,
            json={"url": TEST_URL},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'stream' or data.get('url'):
                print_success(f"Working! Response: {data.get('status', 'ok')}")
                results["cobalt"] = True
                return True
            elif data.get('status') == 'error':
                print_fail(f"Error: {data.get('text', 'Unknown')}")
            else:
                print_warn(f"Response: {json.dumps(data)[:200]}")
        else:
            print_fail(f"Status: {response.status_code}")
            
    except Exception as e:
        print_fail(f"Error: {e}")
    
    results["cobalt"] = False
    return False

# ============================================================
# METHOD 9: Direct YouTube API (needs API key)
# ============================================================
def test_youtube_api():
    """Test YouTube Data API (requires API key)"""
    print_header("METHOD 9: YouTube Data API")
    
    api_key = os.environ.get("YOUTUBE_API_KEY")
    
    if not api_key:
        print_warn("YOUTUBE_API_KEY not set. Skipping.")
        results["youtube_api"] = "no_api_key"
        return False
    
    try:
        import requests
    except ImportError:
        print_fail("requests not installed")
        return False
    
    print(f"\n📌 Testing YouTube Data API")
    
    try:
        api_url = f"https://www.googleapis.com/youtube/v3/videos?id={TEST_VIDEO_ID}&key={api_key}&part=snippet,contentDetails"
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                print_success("API working! (Note: This only gets metadata, not download URL)")
                results["youtube_api"] = "metadata_only"
                return False  # API doesn't provide download URLs
        
        print_fail(f"Status: {response.status_code}")
        
    except Exception as e:
        print_fail(f"Error: {e}")
    
    results["youtube_api"] = False
    return False

# ============================================================
# METHOD 10: yt-dlp with Cookies file
# ============================================================
def test_ytdlp_with_cookies():
    """Test yt-dlp with cookies file"""
    print_header("METHOD 10: yt-dlp with Cookies")
    
    cookies_file = Path("youtube_cookies.txt")
    
    if not cookies_file.exists():
        # Try to find cookies file in common locations
        possible_paths = [
            Path.home() / "youtube_cookies.txt",
            Path.home() / "cookies.txt",
            Path("cookies.txt"),
        ]
        
        for p in possible_paths:
            if p.exists():
                cookies_file = p
                break
    
    if not cookies_file.exists():
        print_warn("No cookies file found. Create youtube_cookies.txt")
        print("   Use browser extension like 'Get cookies.txt' to export YouTube cookies")
        results["ytdlp_cookies"] = "no_cookies_file"
        return False
    
    output_file = str(OUTPUT_DIR / "cookies_test.mp4")
    
    cmd = [
        "yt-dlp",
        "-f", "worst",
        "-o", output_file,
        "--cookies", str(cookies_file),
        "--no-playlist",
        TEST_URL
    ]
    
    print(f"\n📌 Testing with cookies: {cookies_file}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0 and Path(output_file).exists():
            size = Path(output_file).stat().st_size
            print_success(f"Downloaded! Size: {size/1024:.1f} KB")
            results["ytdlp_cookies"] = True
            Path(output_file).unlink()
            return True
        else:
            print_fail(f"Failed: {result.stderr[:200] if result.stderr else 'Unknown'}")
            
    except Exception as e:
        print_fail(f"Error: {e}")
    
    results["ytdlp_cookies"] = False
    return False

# ============================================================
# METHOD 11: yt-dlp with PO Token
# ============================================================
def test_ytdlp_po_token():
    """Test yt-dlp with PO Token"""
    print_header("METHOD 11: yt-dlp with PO Token")
    
    po_token = os.environ.get("YOUTUBE_PO_TOKEN")
    visitor_data = os.environ.get("YOUTUBE_VISITOR_DATA")
    
    if not po_token or not visitor_data:
        print_warn("YOUTUBE_PO_TOKEN and YOUTUBE_VISITOR_DATA not set")
        print("   Get these from: https://github.com/yt-dlp/yt-dlp/wiki/Extractors#po-token-guide")
        results["ytdlp_po_token"] = "no_token"
        return False
    
    output_file = str(OUTPUT_DIR / "po_token_test.mp4")
    
    cmd = [
        "yt-dlp",
        "-f", "worst",
        "-o", output_file,
        "--extractor-args", f"youtube:player_client=web;po_token=web+{po_token};visitor_data={visitor_data}",
        "--no-playlist",
        TEST_URL
    ]
    
    print(f"\n📌 Testing with PO Token")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0 and Path(output_file).exists():
            size = Path(output_file).stat().st_size
            print_success(f"Downloaded! Size: {size/1024:.1f} KB")
            results["ytdlp_po_token"] = True
            Path(output_file).unlink()
            return True
        else:
            print_fail(f"Failed: {result.stderr[:200] if result.stderr else 'Unknown'}")
            
    except Exception as e:
        print_fail(f"Error: {e}")
    
    results["ytdlp_po_token"] = False
    return False

# ============================================================
# MAIN
# ============================================================
def main():
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        YouTube Video Download Test Script                     ║
║        Testing all possible methods                           ║
╠══════════════════════════════════════════════════════════════╣
║  Test Video: {TEST_VIDEO_ID} (Me at the zoo)                  ║
║  Output Dir: {str(OUTPUT_DIR)[:40]:<40} ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    working_methods = []
    
    # Run all tests
    tests = [
        ("yt-dlp CLI", test_ytdlp_cli),
        ("yt-dlp Python", test_ytdlp_python),
        ("pytube", test_pytube),
        ("pytubefix", test_pytubefix),
        ("youtube-dl", test_youtube_dl),
        ("Invidious API", test_invidious),
        ("Piped API", test_piped),
        ("Cobalt API", test_cobalt),
        ("YouTube API", test_youtube_api),
        ("yt-dlp Cookies", test_ytdlp_with_cookies),
        ("yt-dlp PO Token", test_ytdlp_po_token),
    ]
    
    for name, test_func in tests:
        try:
            if test_func():
                working_methods.append(name)
        except KeyboardInterrupt:
            print("\n\nInterrupted by user")
            break
        except Exception as e:
            print_fail(f"Test {name} crashed: {e}")
    
    # Print summary
    print_header("SUMMARY")
    
    print("\n📊 Results:")
    for method, result in results.items():
        if result is True:
            print_success(f"{method}")
        elif result == "not_installed":
            print_warn(f"{method} - Not installed")
        elif result in ["no_api_key", "no_cookies_file", "no_token", "metadata_only"]:
            print_warn(f"{method} - {result}")
        else:
            print_fail(f"{method}")
    
    print(f"\n{'='*60}")
    if working_methods:
        print(f"{Colors.GREEN}✅ WORKING METHODS: {', '.join(working_methods)}{Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ NO WORKING METHODS FOUND{Colors.RESET}")
        print("\nSuggestions:")
        print("1. Try using cookies from your browser")
        print("2. Get PO Token: https://github.com/yt-dlp/yt-dlp/wiki/Extractors#po-token-guide")
        print("3. Use a VPN or proxy")
        print("4. Wait and try later (rate limiting)")
    print(f"{'='*60}")
    
    return len(working_methods) > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
