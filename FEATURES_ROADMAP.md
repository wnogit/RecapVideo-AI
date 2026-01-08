# 🎬 RecapVideo.AI - Features Roadmap

## လုပ်ဆောင်ချက်များ အစီအစဉ် (Feature Implementation Plan)

---

## ✅ Phase 1: Core Features (အခြေခံ လုပ်ဆောင်ချက်များ) - COMPLETED

အခြေခံ Video ဖန်တီးခြင်း စနစ် ပြီးစီးပြီး ဖြစ်သည်။

| Feature | Status | Description (ရှင်းလင်းချက်) |
|---------|--------|---------------------------|
| YouTube Shorts URL | ✅ Done | YouTube Shorts Video URL ထည့်သွင်းခြင်း |
| Transcript Extraction | ✅ Done | Video မှ စကားပြော/စာသား ထုတ်ယူခြင်း |
| AI Script Generation | ✅ Done | Gemini AI ဖြင့် မြန်မာဘာသာ Recap Script ရေးသားခြင်း |
| Burmese TTS | ✅ Done | Microsoft Edge TTS ဖြင့် မြန်မာအသံ ထုတ်ခြင်း |
| Video Rendering | ✅ Done | Video နှင့် Audio ပေါင်းစပ်ခြင်း |
| Cloud Storage | ✅ Done | Cloudflare R2 သို့ Upload ခြင်း |

---

## 🔴 Phase 2: Copyright Bypass (မူပိုင်ခွင့် ကာကွယ်ခြင်း)

YouTube, TikTok, Facebook တို့၏ Copyright Detection AI ကို ရှောင်ရှားရန် Video ကို အနည်းငယ် ပြောင်းလဲခြင်း။ ဤလုပ်ဆောင်ချက်များက မူရင်း Video နှင့် ကွဲပြားစေပြီး Copyright Strike မခံရအောင် ကာကွယ်ပေးသည်။

### Features

| Feature | Description (ရှင်းလင်းချက်) | Technical Details |
|---------|---------------------------|-------------------|
| **Auto Color Adjust** | အရောင် အလိုအလျောက် ပြောင်းလဲခြင်း | Brightness +6%, Contrast +10%, Saturation +10% ပြောင်းခြင်းဖြင့် မူရင်း Video နှင့် ကွဲပြားစေသည် |
| **Horizontal Flip** | ဘယ်ညာ ပြောင်းခြင်း | Video ကို Mirror Effect ဖြင့် ပြောင်းပြန်လှန်ခြင်း။ စာသား/Logo များ ပြောင်းပြန်ဖြစ်သွားမည် |
| **Slight Zoom** | အနည်းငယ် ချဲ့ခြင်း | 3-5% Zoom in လုပ်ခြင်းဖြင့် Frame ပြောင်းလဲစေသည် |
| **Speed Adjust** | အရှိန် အနည်းငယ် ပြောင်းခြင်း | 1.02x - 1.05x Speed မြှင့်ခြင်း (မသိသာအောင်) |
| **Audio Pitch Shift** | အသံအနိမ့်အမြင့် ပြောင်းခြင်း | TTS Audio ကို ±3% Pitch ပြောင်းခြင်းဖြင့် မူရင်းနှင့် ကွဲပြားစေသည် |

### User Options (အသုံးပြုသူ ရွေးချယ်စရာများ)

```
☑ Auto Color Adjust (အရောင်ပြောင်း) - Recommended
☑ Horizontal Flip (ဘယ်ညာပြောင်း) - Recommended
☐ Slight Zoom (အနည်းငယ် Zoom)
☐ Speed Adjust (အရှိန်ပြောင်း)
☑ Audio Pitch Shift (အသံအမြင့်ပြောင်း) - Recommended
```

### FFmpeg Implementation

```bash
# Color Adjust
-vf "eq=brightness=0.06:contrast=1.1:saturation=1.1"

# Horizontal Flip
-vf "hflip"

# Zoom 5%
-vf "scale=1.05*iw:-1,crop=iw/1.05:ih/1.05"

# Speed 1.03x
-filter:v "setpts=0.97*PTS" -filter:a "atempo=1.03"

# Pitch Shift +3%
-af "asetrate=44100*1.03,aresample=44100"
```

---

## 🟠 Phase 3: Auto Subtitles (စာတန်းထိုး အလိုအလျောက် ထည့်သွင်းခြင်း)

မြန်မာဘာသာ စာတန်းထိုးကို Video ထဲသို့ အလိုအလျောက် ထည့်သွင်းခြင်း။ AI Script ကို အချိန်နှင့်တကွ Subtitle အဖြစ် ပြောင်းလဲပေးသည်။

### Features

| Feature | Options | Description (ရှင်းလင်းချက်) |
|---------|---------|---------------------------|
| **Enable Subtitles** | On/Off | စာတန်းထိုး ဖွင့်/ပိတ် |
| **Font Family** | Unicode Myanmar, Pyidaungsu, Padauk | မြန်မာစာ Font ပုံစံ ရွေးချယ်ခြင်း |
| **Font Size** | Small (24px), Medium (32px), Large (40px), XL (48px) | စာလုံးအရွယ်အစား - Large အကြံပြုသည် |
| **Position** | Top, Center, Bottom | စာတန်း တည်နေရာ - Bottom အကြံပြုသည် |
| **Background** | None, Semi-transparent, Solid | စာတန်း နောက်ခံ - Semi-transparent အကြံပြုသည် |
| **Text Color** | White, Yellow, Custom | စာလုံးအရောင် - White အကြံပြုသည် |
| **Word Highlight** | On/Off | လက်ရှိပြောနေသော စကားလုံးကို Highlight ပြခြင်း (Karaoke Style) |

### Default Settings (အကြံပြုချက်)

```
☑ Enable Subtitles: ON
   Font: Unicode Myanmar (Pyidaungsu)
   Size: Large (40px)
   Position: Bottom
   Background: Semi-transparent (50% black)
   Color: White (#FFFFFF)
   Word Highlight: ON
```

### Technical Implementation

**SRT/ASS Subtitle Generation:**
- TTS Audio မှ Word timing ထုတ်ယူခြင်း
- Script ကို Sentence များ ခွဲခြားခြင်း
- Timing sync ဖြင့် Subtitle file ဖန်တီးခြင်း

**FFmpeg Subtitle Burn:**
```bash
# ASS Subtitle burn
-vf "ass=subtitle.ass"

# SRT Subtitle with styling
-vf "subtitles=subtitle.srt:force_style='FontName=Pyidaungsu,FontSize=40,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1'"
```

---

## 🟡 Phase 4: Video Quality & Format (Video အရည်အသွေး နှင့် ပုံစံ)

Platform အလိုက် သင့်တော်သော Video Format နှင့် Resolution ရွေးချယ်ခြင်း။

### Video Quality

| Quality | Resolution | Default |
|---------|------------|---------|
| **High** | 1080p Full HD (1920x1080 / 1080x1920) | ✅ Default |

**Note:** 1080p သည် YouTube, TikTok, Instagram အားလုံးအတွက် အကောင်းဆုံး အရည်အသွေး ဖြစ်သည်။

### Aspect Ratio (Video ပုံစံ)

| Format | Ratio | Platforms | Description (ရှင်းလင်းချက်) |
|--------|-------|-----------|---------------------------|
| **9:16 Vertical** | 1080x1920 | TikTok, Reels, Shorts | ဖုန်းမှာ အပြည့် ကြည့်ရှုနိုင်သော ဒေါင်လိုက် Video - **Default** |
| **16:9 Horizontal** | 1920x1080 | YouTube Standard | YouTube ပုံမှန် Video ပုံစံ - Desktop ကြည့်ရှုသူများအတွက် |
| **1:1 Square** | 1080x1080 | Instagram, Facebook | လေးထောင့်ကွက် ပုံစံ - Feed များတွင် ကောင်းမွန်စွာ ပြသနိုင်သည် |
| **4:5 Portrait** | 1080x1350 | Instagram Feed | Instagram Feed အတွက် အကောင်းဆုံး - ပိုကြီးသော Screen Space ရရှိသည် |

### User Selection UI

```
Video Format (ရွေးချယ်ပါ):

● 9:16 Vertical (TikTok, Reels, Shorts) - Default
○ 16:9 Horizontal (YouTube)
○ 1:1 Square (Instagram, Facebook)
○ 4:5 Portrait (Instagram Feed)
```

---

## 🟢 Phase 5: Logo & Watermark (Logo ထည့်သွင်းခြင်း)

Channel Branding အတွက် Logo ထည့်သွင်းခြင်း။ Video တစ်ခုလုံးတွင် Logo ပြသနေမည်။

### Features

| Feature | Options | Description (ရှင်းလင်းချက်) |
|---------|---------|---------------------------|
| **Logo Upload** | PNG (Transparent) | Transparent background ရှိသော PNG Logo တင်ခြင်း |
| **Logo Position** | Top-Left, Top-Right, Bottom-Left, Bottom-Right | Logo တည်နေရာ ရွေးချယ်ခြင်း |
| **Logo Size** | Small (50px), Medium (80px), Large (120px) | Logo အရွယ်အစား |
| **Logo Opacity** | 50%, 70%, 100% | Logo အလင်းပိတ်မှု - 70% အကြံပြုသည် |

### User Settings (သိမ်းထားနိုင်သော Settings)

User Profile တွင် Default Logo သိမ်းထားနိုင်သည်။ Video ဖန်တီးတိုင်း ထပ်တင်စရာမလို။

```
My Logo Settings:
├── Logo: channel_logo.png ✓
├── Position: Top-Right
├── Size: Medium (80px)
└── Opacity: 70%
```

### FFmpeg Implementation

```bash
# Logo overlay at top-right
-i logo.png -filter_complex "overlay=W-w-20:20"

# Logo with opacity
-i logo.png -filter_complex "[1:v]format=rgba,colorchannelmixer=aa=0.7[logo];[0:v][logo]overlay=W-w-20:20"
```

---

## 🔵 Phase 6: Outro Template (Video အဆုံး Outro ထည့်သွင်းခြင်း)

Video အဆုံးတွင် Subscribe/Follow Animation ထည့်သွင်းခြင်း။ Platform အလိုက် Customize လုပ်နိုင်သည်။

**Note:** Intro မထည့်ပါ။ Outro သာ Video အဆုံးတွင် ထည့်သွင်းမည်။

### Platform-Specific Outro Templates

#### YouTube Outro (5 seconds)

| Field | Description | Example |
|-------|-------------|---------|
| `{channel_name}` | YouTube Channel အမည် | "RecapVideo MM" |
| `{channel_logo}` | Channel Logo/Avatar | User uploaded logo |
| `{subscribe_text}` | Subscribe ခိုင်းစာ | "Subscribe လုပ်ပေးပါ" |

**Animation:**
- Subscribe Button Animation (Red button, Click effect)
- Bell Icon Animation (Notification bell ring)
- Channel Logo Display

#### TikTok Outro (4 seconds)

| Field | Description | Example |
|-------|-------------|---------|
| `{username}` | TikTok Username | "@recapvideo_mm" |
| `{follow_text}` | Follow ခိုင်းစာ | "Follow လုပ်ပေးပါ" |

**Animation:**
- Follow Button Animation (Pink/Red heart)
- Username Display with @ symbol
- Heart floating animation

#### Facebook Outro (4 seconds)

| Field | Description | Example |
|-------|-------------|---------|
| `{page_name}` | Facebook Page အမည် | "RecapVideo Myanmar" |
| `{like_text}` | Like ခိုင်းစာ | "Page ကို Like & Follow လုပ်ပေးပါ" |

**Animation:**
- Thumbs Up Animation (Blue like button)
- Page Name Display
- Share icon animation

#### Instagram Outro (4 seconds)

| Field | Description | Example |
|-------|-------------|---------|
| `{username}` | Instagram Username | "@recapvideo.mm" |
| `{follow_text}` | Follow ခိုင်းစာ | "Follow & Share လုပ်ပေးပါ" |

**Animation:**
- Follow Button Animation (Gradient purple/pink)
- Heart and Share icons
- Username with verified-style badge

### User Settings

```
Outro Settings:
├── Enable Outro: ☑ ON
├── Platform: [▼ YouTube]
├── Channel Name: [RecapVideo MM________]
├── Channel Logo: [logo.png ✓]
└── Duration: 5 seconds
```

### Technical Implementation

- Pre-rendered Outro templates (MP4)
- Dynamic text overlay using FFmpeg
- Logo placement with user's uploaded logo
- Append to end of main video

---

## 🟣 Phase 8: AI Avatar / Virtual Presenter (AI ပုံရိပ် Presenter)

TTS Audio နှင့် Lip-sync ညီသော Virtual Presenter ထည့်သွင်းခြင်း။ Video တွင် စကားပြောနေသော ဇာတ်ကောင် ပေါ်လာမည်။

### API Options

| Provider | Free Tier | Pricing | Recommendation |
|----------|-----------|---------|----------------|
| **D-ID** | ✅ 20 credits/month FREE | $5.99/month (15 mins) | ⭐ Recommended |
| **HeyGen** | ✅ 1 credit FREE trial | $24/month | Good quality |
| **Rephrase.ai** | ✅ Limited free | Custom pricing | Enterprise |

**Recommendation:** D-ID API ကို အသုံးပြုမည်။ Free tier ရှိပြီး Quality ကောင်းသည်။

### Features

| Feature | Options | Description (ရှင်းလင်းချက်) |
|---------|---------|---------------------------|
| **Enable Avatar** | On/Off | AI Avatar ဖွင့်/ပိတ် |
| **Avatar Style** | | Avatar ပုံစံ ရွေးချယ်ခြင်း |
| | Realistic Female | လူပုံ အမျိုးသမီး |
| | Realistic Male | လူပုံ အမျိုးသား |
| | Cartoon Female | ကာတွန်းပုံ အမျိုးသမီး |
| | Cartoon Male | ကာတွန်းပုံ အမျိုးသား |
| **Avatar Position** | Bottom-Left, Bottom-Right, Bottom-Center | Avatar တည်နေရာ |
| **Avatar Size** | Small, Medium, Large | Avatar အရွယ်အစား |
| **Background** | Transparent, Solid Color | Avatar နောက်ခံ |

### How It Works

1. **TTS Audio Generation** - Burmese TTS ဖြင့် Audio ထုတ်ခြင်း
2. **Send to D-ID API** - Audio + Avatar Style ပေးပို့ခြင်း
3. **Receive Avatar Video** - Lip-synced Avatar Video ရရှိခြင်း
4. **Overlay on Main Video** - Main Video ပေါ်တွင် Avatar ထပ်တင်ခြင်း

### D-ID API Integration

```python
# D-ID API Call
import requests

def create_avatar_video(audio_url: str, avatar_id: str) -> str:
    """Generate lip-synced avatar video using D-ID API."""
    
    response = requests.post(
        "https://api.d-id.com/talks",
        headers={
            "Authorization": f"Basic {D_ID_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "source_url": avatar_id,  # Avatar image URL
            "script": {
                "type": "audio",
                "audio_url": audio_url  # TTS audio URL
            },
            "config": {
                "result_format": "mp4"
            }
        }
    )
    
    return response.json()["result_url"]
```

### User Selection UI

```
AI Avatar Settings:
├── Enable Avatar: ☑ ON
├── Style: [▼ Cartoon Female]
├── Position: [▼ Bottom-Right]
├── Size: [▼ Medium]
└── Background: [▼ Transparent]

Note: Avatar feature uses D-ID API (20 free credits/month)
```

---

## ⬛ Phase 9: Important Effects (အရေးကြီး Effects များ)

Video ကို ပိုမိုကောင်းမွန်စေရန် အထူးပြုပြင်ချက်များ။

### Custom Blur (Blur Effect)

| Feature | Description (ရှင်းလင်းချက်) |
|---------|---------------------------|
| **Background Blur** | Video နောက်ခံကို Blur လုပ်ခြင်း - 16:9 Video ကို 9:16 ပြောင်းသောအခါ ဘေးဘက် blur နောက်ခံ ထည့်ခြင်း |
| **Border Blur** | Video ဘောင်ကို Blur effect ထည့်ခြင်း |

**Use Case:** Horizontal (16:9) Video ကို Vertical (9:16) ပြောင်းလိုသောအခါ အထက်/အောက် black bars မဖြစ်စေဘဲ Blur background ထည့်ခြင်း။

```bash
# Background blur for aspect ratio conversion
-vf "split[original][blur];[blur]scale=1080:1920,boxblur=20:5[bg];[original]scale=-1:1080[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
```

### Border/Frame (ဘောင် ထည့်ခြင်း)

| Style | Description |
|-------|-------------|
| **Simple Border** | 10px white/black ဘောင် |
| **Rounded Corners** | ထောင့်ဝိုင်း ဘောင် |
| **Neon Glow** | Glowing neon color ဘောင် |
| **Gradient Border** | Gradient color ဘောင် |

### Filter Presets (Color Filter များ)

| Filter | Description (ရှင်းလင်းချက်) |
|--------|---------------------------|
| **None** | မူရင်းအတိုင်း (Default) |
| **Warm** | အနွေးဓာတ် ပိုထည့်ခြင်း - Cozy feeling |
| **Cool** | အအေးဓာတ် ပိုထည့်ခြင်း - Professional look |
| **Vintage** | ရှေးဟောင်းပုံစံ - Nostalgic feeling |
| **Cinema** | ရုပ်ရှင်ပုံစံ - Movie-like colors |
| **High Contrast** | Contrast မြင့်မြင့် - Bold look |

```bash
# Warm filter
-vf "colortemperature=temperature=6500"

# Cinema filter
-vf "curves=preset=cross_process,eq=saturation=0.9"

# Vintage filter
-vf "curves=preset=vintage,vignette"
```

---

## 🔶 Phase 10: Auto Thumbnail (Thumbnail အလိုအလျောက် ဖန်တီးခြင်း)

YouTube, TikTok အတွက် Eye-catching Thumbnail အလိုအလျောက် ဖန်တီးပေးခြင်း။

### Features

| Feature | Description (ရှင်းလင်းချက်) |
|---------|---------------------------|
| **Auto Frame Selection** | Video မှ အကောင်းဆုံး Frame ကို AI ဖြင့် ရွေးချယ်ခြင်း |
| **Title Overlay** | မြန်မာစာ Title ကို Thumbnail ပေါ်တွင် ထည့်ခြင်း |
| **Face Enhancement** | လူမျက်နှာကို Detect လုပ်ပြီး Highlight ပြခြင်း |
| **Template Styles** | ကြိုတင်ပြင်ဆင်ထားသော Design ပုံစံများ |

### Thumbnail Templates

| Template | Description | Best For |
|----------|-------------|----------|
| **Clickbait** | Bold text, Emoji, Bright colors | Entertainment content |
| **Clean** | Minimal design, Clear text | Educational content |
| **Professional** | Corporate look, Subtle effects | Business content |
| **News** | Breaking news style, Red accents | News/Updates |

### Technical Implementation

```python
from PIL import Image, ImageDraw, ImageFont

def generate_thumbnail(video_frame: Image, title: str, template: str) -> Image:
    """Generate thumbnail with title overlay."""
    
    # Apply template background/overlay
    thumb = apply_template(video_frame, template)
    
    # Add Burmese title text
    draw = ImageDraw.Draw(thumb)
    font = ImageFont.truetype("Pyidaungsu-Regular.ttf", 60)
    
    # Add text with outline
    draw.text((x, y), title, font=font, fill="white", stroke_width=3, stroke_fill="black")
    
    return thumb
```

---

## 📊 Summary: Feature Implementation Timeline

| Phase | Features | Priority | Status |
|-------|----------|----------|--------|
| 1 | Core Video Processing | 🔴 Critical | ✅ Done |
| 2 | Copyright Bypass | 🔴 Critical | 🔄 Next |
| 3 | Auto Subtitles | 🔴 Critical | 🔄 Next |
| 4 | Quality & Format (1080p + 4 ratios) | 🟠 High | Pending |
| 5 | Logo & Watermark | 🟠 High | Pending |
| 6 | Outro Templates | 🟡 Medium | Pending |
| 8 | AI Avatar (D-ID API) | 🟢 Nice-to-have | Pending |
| 9 | Effects (Blur, Border, Filters) | 🟢 Nice-to-have | Pending |
| 10 | Auto Thumbnail | 🔵 Bonus | Pending |

---

## 💰 Cost Analysis

| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| Edge TTS | ✅ Unlimited FREE | - |
| TranscriptAPI | Limited | $9/month |
| Gemini AI | ✅ FREE tier | Pay-as-you-go |
| D-ID Avatar | ✅ 20 credits/month | $5.99/month |
| Cloudflare R2 | ✅ 10GB FREE | $0.015/GB |

---

## 🔧 Database Schema Update

```python
class VideoOptions(BaseModel):
    """Video processing options."""
    
    # Copyright Bypass
    copyright_bypass: dict = {
        "color_adjust": True,
        "flip_horizontal": True,
        "zoom_percent": 0,
        "speed_adjust": 1.0,
        "pitch_shift": 3
    }
    
    # Quality & Format
    quality: str = "high"  # high only
    aspect_ratio: str = "9:16"  # 9:16, 16:9, 1:1, 4:5
    
    # Subtitles
    subtitles: dict = {
        "enabled": True,
        "font": "pyidaungsu",
        "size": "large",
        "position": "bottom",
        "background": "semi",
        "color": "#FFFFFF",
        "word_highlight": True
    }
    
    # Logo
    logo: dict = {
        "enabled": False,
        "file_url": None,
        "position": "top_right",
        "size": "medium",
        "opacity": 70
    }
    
    # Outro
    outro: dict = {
        "enabled": False,
        "platform": "youtube",
        "channel_name": "",
        "channel_logo": None,
        "duration": 5
    }
    
    # Avatar (D-ID)
    avatar: dict = {
        "enabled": False,
        "style": "cartoon_female",
        "position": "bottom_right",
        "size": "medium"
    }
    
    # Effects
    effects: dict = {
        "blur_background": False,
        "border": None,
        "filter": None
    }
```

---

*Last Updated: January 8, 2026*
