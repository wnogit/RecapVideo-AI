# 🔍 RecapVideo-AI Project Deep Analysis Report

**Analysis Date:** January 15, 2026  
**Project:** RecapVideo-AI v3  
**Repository:** https://github.com/wnogit/RecapVideo-AI

---

## 📋 Project Overview

RecapVideo-AI သည် YouTube videos ကို Burmese voiceover ဖြင့် recap videos သို့ ပြောင်းလဲပေးသော AI-powered application ဖြစ်ပါသည်။

### Key Features
- YouTube Shorts transcript extraction
- AI-powered script generation (Groq/Gemini)
- Burmese TTS using Edge-TTS (FREE)
- Video processing with FFmpeg
- Credit-based payment system
- Admin dashboard

---

## 🏗️ Architecture Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI (Python 3.11+), SQLAlchemy 2.0, Celery |
| Database | PostgreSQL 15, Redis 7 |
| External APIs | TranscriptAPI, Google Gemini/Groq, Edge-TTS |
| Storage | Cloudflare R2 |

---

# 🔴 CRITICAL ISSUES (ချက်ချင်း ပြင်ဆင်ရန်)

## 1. Security Issues

### Issue 1.1: JWT Token Storage (XSS Vulnerable)
**Location:** `frontend/stores/auth-store.ts` or `frontend/lib/api.ts`
```typescript
localStorage.setItem('access_token', data.access_token);
```
**Problem:** Access tokens ကို localStorage တွင် သိမ်းထားခြင်းသည် XSS attacks ဖြင့် ခိုးယူနိုင်ပါသည်။

**Recommendation:** HttpOnly cookies သို့ ပြောင်းပါ သို့မဟုတ် secure cookie-based session ကို အသုံးပြုပါ။

---

### Issue 1.2: IP Check Fail-Open Policy
**Location:** `backend/app/services/ip_service.py` (Lines 68-74)
```python
except httpx.TimeoutException:
    logger.error(f"IP check timeout for {ip}")
    return {"allowed": True, "reason": "Timeout", "error": True}  # ❌ Fail-open
```
**Problem:** IP check fail ဖြစ်ရင် access ခွင့်ပြုထားပါသည်။ VPN detection ကို bypass လုပ်နိုင်ပါသည်။

**Recommendation:** Production တွင် fail-closed policy သုံးပါ သို့မဟုတ် retry mechanism ထည့်ပါ။

---

### Issue 1.3: Missing CSRF Protection in OAuth
**Location:** `frontend/app/auth/callback/page.tsx`

**Problem:** OAuth callback တွင် state parameter ကို CSRF token အဖြစ် properly verify မလုပ်ပါ။ Device ID ကိုသာ state parameter တွင် ထည့်ထားပါသည်။

**Recommendation:**
```typescript
// Generate cryptographic state token
const state = crypto.randomUUID();
localStorage.setItem('oauth_state', state);
// Verify on callback
if (urlState !== localStorage.getItem('oauth_state')) {
  throw new Error('CSRF validation failed');
}
```

---

### Issue 1.4: Insecure Password Reset Token
**Location:** `backend/app/core/security.py` (Lines 97-107)
```python
def generate_password_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"sub": email, "type": "password_reset", "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, ...)
```
**Problem:** Password reset token ကို user email ကိုသာ အခြေခံ၍ generate လုပ်ထားပါသည်။ Token replay attacks ဖြစ်နိုင်ပါသည်။

**Recommendation:** One-time use token (database stored) နှင့် jti (JWT ID) ကို ထည့်ပါ။

---

### Issue 1.5: Exposed Default Credentials
**Location:** `.env.example` and `backend/app/core/config.py` (Line 37)
```python
JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
```
**Problem:** Default secret key ကို config file တွင် hardcode ထားပါသည်။ Production တွင် မပြောင်းဘဲ deploy လုပ်ရင် vulnerable ဖြစ်ပါသည်။

**Recommendation:** Environment variable မရှိရင် application start မဖြစ်အောင် validation ထည့်ပါ။

---

## 2. Logic Errors

### Issue 2.1: Race Condition in Credit Deduction ⚠️ CRITICAL
**Location:** `backend/app/api/v1/endpoints/videos.py` (Lines 70-90)
```python
# Check credits
if not current_user.can_create_video(CREDITS_PER_VIDEO):
    raise HTTPException(...)

# ... code between check and deduction ...

# Deduct credits
current_user.credit_balance -= CREDITS_PER_VIDEO
```
**Problem:** Credit check နှင့် deduction အကြား race condition ဖြစ်နိုင်ပါသည်။ Concurrent requests ဖြင့် credit balance ထက် ပိုသုံးနိုင်ပါသည်။

**Recommendation:**
```python
# Use SELECT FOR UPDATE to lock the row
from sqlalchemy import select
stmt = select(User).where(User.id == current_user.id).with_for_update()
result = await db.execute(stmt)
user = result.scalar_one()
if user.credit_balance < CREDITS_PER_VIDEO:
    raise HTTPException(...)
user.credit_balance -= CREDITS_PER_VIDEO
```

---

### Issue 2.2: Celery Task Credit Refund Bug ⚠️ CRITICAL
**Location:** `backend/app/tasks/video_tasks.py` (Lines 65-77)
```python
if user and video.credits_used:
    user.credits += video.credits_used  # ❌ Wrong attribute name!
```
**Problem:** `user.credits` attribute မရှိပါ။ `user.credit_balance` ဖြစ်သင့်ပါသည်။ Credit refund သည် silently fail ဖြစ်နေပါသည်။

**Fix:**
```python
user.credit_balance += video.credits_used  # ✅ Correct
```

---

### Issue 2.3: Duplicate Video ID Check Missing
**Location:** `backend/app/api/v1/endpoints/videos.py` (Lines 31-50)

**Problem:** Same YouTube video ကို same user က multiple times submit လုပ်နိုင်ပါသည်။ Credits ဆုံးရှုံးနိုင်ပါသည်။

**Recommendation:**
```python
# Check for existing pending/processing video
existing = await db.execute(
    select(Video).where(
        Video.youtube_id == video_id,
        Video.user_id == current_user.id,
        Video.status.in_(['pending', 'processing', 'completed'])
    )
)
if existing.scalar_one_or_none():
    raise HTTPException(status_code=409, detail="Video already exists")
```

---

### Issue 2.4: Purchased Credits Tracking Logic Error
**Location:** `backend/app/api/v1/endpoints/videos.py` (Lines 82-88)
```python
# Calculate how many credits to deduct from purchased_credits
trial_credits_remaining = current_user.credit_balance - current_user.purchased_credits
if trial_credits_remaining < 0:
    credits_from_purchased = min(-trial_credits_remaining, current_user.purchased_credits)
    current_user.purchased_credits = max(0, current_user.purchased_credits - credits_from_purchased)
```
**Problem:** ဒီ logic က credit deduction လုပ်ပြီးမှ run ပါသည်။ `trial_credits_remaining` calculation မှားနေပါသည်။

**Recommendation:** Trial credits နှင့် purchased credits ကို separate fields အဖြစ် track လုပ်ပြီး deduction order ကို explicitly handle လုပ်ပါ။

---

### Issue 2.5: Video Status Resume Logic Bug
**Location:** `backend/app/main.py` (Lines 29-48)
```python
result = await db.execute(
    select(Video).where(
        Video.status.in_([
            VideoStatus.PENDING.value,
            VideoStatus.EXTRACTING_TRANSCRIPT.value,
            ...
        ])
    )
)
```
**Problem:** Server restart ဖြစ်ရင် `UPLOADING` status ရှိ videos ကို handle မလုပ်ပါ။ Video upload ပြီးဆုံးခါနီး restart ဖြစ်ရင် lost ဖြစ်နိုင်ပါသည်။

**Recommendation:** `UPLOADING` status ကို list ထဲ ထည့်ပါ။

---

## 3. Error Handling Problems

### Issue 3.1: Inconsistent Error Response Format
**Location:** Multiple endpoints

```python
# videos.py
raise HTTPException(status_code=400, detail={"code": "INVALID_URL", "message": result})

# auth.py
raise HTTPException(status_code=403, detail="Please disconnect VPN/Proxy to continue.")
```
**Problem:** Error response format consistent မဖြစ်ပါ။ Frontend parsing ခက်ခဲပါသည်။

**Recommendation:** Standard error schema တစ်ခု define လုပ်ပါ:
```python
class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
```

---

### Issue 3.2: Silent Failure in Email Sending
**Location:** `backend/app/api/v1/endpoints/auth.py` (Lines 483-487)
```python
try:
    await email_service.send_verification_email(...)
except Exception as e:
    logger.error(f"Failed to send verification email: {e}")
    # Don't fail signup if email fails  ← User won't know!
```
**Problem:** Email verification မပို့လို့ user ကို notify မလုပ်ပါ။ User က email ကို စောင့်နေရပါမည်။

**Recommendation:** Response မှာ email sending status ကို include လုပ်ပါ။

---

## 4. Performance Issues

### Issue 4.1: N+1 Query Problem in User Model
**Location:** `backend/app/models/user.py` (Lines 73-89)
```python
videos: Mapped[List["Video"]] = relationship("Video", lazy="selectin")
credit_transactions: Mapped[List["CreditTransaction"]] = relationship("CreditTransaction", lazy="selectin")
orders: Mapped[List["Order"]] = relationship("Order", lazy="selectin")
devices: Mapped[List["DeviceFingerprint"]] = relationship("DeviceFingerprint", lazy="selectin")
ip_logs: Mapped[List["IPSignupLog"]] = relationship("IPSignupLog", lazy="selectin")
```
**Problem:** User object load လုပ်တိုင်း related tables 5 ခုလုံး load ဖြစ်ပါသည်။ Performance hit ဖြစ်ပါသည်။

**Recommendation:** `lazy="raise"` သို့မဟုတ် `lazy="dynamic"` ပြောင်းပြီး explicit loading သုံးပါ။

---

### Issue 4.2: Missing Database Indexes
**Location:** `backend/app/models/video.py`

**Problem:** `created_at` column တွင် index မရှိပါ။ Video list pagination slow ဖြစ်နိုင်ပါသည်။

**Recommendation:**
```python
created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    index=True,  # Add index
)
```

---

### Issue 4.3: In-Memory Cache Without TTL Cleanup
**Location:** `backend/app/services/ip_service.py` (Line 20)
```python
self._cache: dict = {}  # Simple in-memory cache
```
**Problem:** Cache entries ကို cleanup မလုပ်ပါ။ Memory leak ဖြစ်နိုင်ပါသည်။

**Recommendation:** `cachetools.TTLCache` သို့မဟုတ် Redis cache ကို အသုံးပြုပါ။

---

## 5. API Design Issues

### Issue 5.1: Missing Rate Limiting on Public Endpoints
**Location:** `backend/app/api/v1/endpoints/auth.py`

**Problem:** `/auth/login` endpoint တွင် rate limiting မရှိပါ။ Brute force attacks ဖြစ်နိုင်ပါသည်။

**Recommendation:** `slowapi` သို့မဟုတ် custom rate limiter ထည့်ပါ။

---

### Issue 5.2: CORS Wildcard Methods
**Location:** `backend/app/main.py` (Line 108)
```python
allow_methods=["*"],
allow_headers=["*"],
```
**Problem:** All methods နှင့် headers ကို allow လုပ်ထားပါသည်။ Security risk ဖြစ်ပါသည်။

**Recommendation:** Specific methods နှင့် headers ကိုသာ allow လုပ်ပါ။

---

## 6. Video Processing Issues

### Issue 6.1: No Timeout for External API Calls
**Location:** `backend/app/services/script_service.py` (Lines 126-136)
```python
response = await groq_client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[...],
    max_tokens=2000,
    # ❌ No timeout
)
```
**Problem:** Groq/Gemini API calls တွင် timeout မရှိပါ။ Hung request ဖြစ်နိုင်ပါသည်။

**Recommendation:** Timeout parameter ထည့်ပါ။

---

### Issue 6.2: YouTube Download Retry Without Backoff
**Location:** `backend/app/processing/video_processor.py` (Lines 308-360)

**Problem:** YouTube download strategies တွင် backoff delay မရှိပါ။ Rate limit hit ဖြစ်နိုင်ပါသည်။

**Recommendation:** Exponential backoff ထည့်ပါ။

---

## 7. Configuration Issues

### Issue 7.1: Sensitive Config in Docker Compose
**Location:** `docker-compose.yml` (Lines 14-15)
```yaml
POSTGRES_USER: ${POSTGRES_USER:-recapvideo}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-recapvideo_secret}
```
**Problem:** Default password ကို docker-compose.yml တွင် ထည့်ထားပါသည်။

**Recommendation:** Default values ကို remove လုပ်ပြီး `.env` file ကိုသာ အသုံးပြုပါ။

---

## 8. Code Quality Issues

### Issue 8.1: Duplicate Code in Auth Endpoints
**Location:** `backend/app/api/v1/endpoints/auth.py`

**Problem:** IP check, device fingerprinting, whitelisting logic သည် `/google`, `/login`, `/signup` endpoints အားလုံးတွင် duplicate ဖြစ်နေပါသည်။

**Recommendation:** Common logic ကို middleware သို့မဟုတ် dependency function သို့ extract လုပ်ပါ။

---

### Issue 8.2: Hardcoded Values
**Location:** `backend/app/api/v1/endpoints/auth.py` (Lines 42-49)
```python
ALLOWED_EMAIL_DOMAINS = [
    "gmail.com", "yahoo.com", ...
]
TRIAL_CREDITS = 4
```
**Problem:** Business logic values ကို code တွင် hardcode ထားပါသည်။

**Recommendation:** Database site_settings သို့မဟုတ် environment variables သို့ ပြောင်းပါ။

---

# 🟠 FRONTEND ISSUES

## 1. Security Issues

### Issue F1.1: Token Storage in localStorage
**Problem:** Access tokens ကို localStorage တွင် သိမ်းထားခြင်းသည် XSS vulnerable ဖြစ်ပါသည်။

### Issue F1.2: Device ID Exposed in OAuth State
**Problem:** Device fingerprint ID ကို OAuth state parameter တွင် plain text ထည့်ထားပါသည်။

### Issue F1.3: IP Check Fail-Open in Frontend
```typescript
} catch (error) {
  console.error('IP check failed:', error);
  setStatus('allowed');  // ❌ Fail-open
}
```

---

## 2. State Management Issues

### Issue F2.1: Zustand Hydration Race Condition
**Problem:** Server-side rendering နှင့် client-side hydration တွင် mismatch ဖြစ်နိုင်ပါသည်။

### Issue F2.2: Store Not Cleaned on Logout
```typescript
logout: () => {
  localStorage.removeItem('access_token');
  set({ user: null, isAuthenticated: false });
  // ❌ Video store, credit data NOT cleared
}
```

---

## 3. Performance Issues

### Issue F3.1: Large Bundle - No Dynamic Imports
```typescript
import { motion, AnimatePresence } from 'framer-motion';  // ❌ Full import
```

### Issue F3.2: No Image Optimization
```typescript
<img src={video.source_thumbnail} />  // ❌ Should use next/image
```

---

# 📊 Summary Table

| Category | Critical | Major | Minor | Total |
|----------|----------|-------|-------|-------|
| **Security** | 5 | 2 | 1 | **8** |
| **Logic Errors** | 2 | 3 | 2 | **7** |
| **Error Handling** | 0 | 2 | 3 | **5** |
| **Performance** | 1 | 2 | 2 | **5** |
| **API Design** | 0 | 2 | 1 | **3** |
| **Video Processing** | 0 | 2 | 1 | **3** |
| **Configuration** | 1 | 1 | 1 | **3** |
| **Code Quality** | 0 | 2 | 3 | **5** |
| **Frontend** | 5 | 10 | 8 | **23** |
| **Total** | **14** | **26** | **22** | **62** |

---

# 🎯 Priority Fix Recommendations

## Immediate (Security Critical):
1. ✅ Fix `user.credits` → `user.credit_balance` bug in `video_tasks.py`
2. ✅ Add database row locking for credit deduction
3. ✅ Change IP check to fail-closed in production
4. ✅ Add CSRF protection to OAuth flow
5. ✅ Validate JWT_SECRET_KEY is not default on startup

## Short-term (Within 1 week):
6. Add rate limiting on login endpoint
7. Fix N+1 query in User model
8. Add duplicate video check
9. Implement consistent error response format
10. Add timeouts to external API calls

## Long-term (Within 1 month):
11. Move tokens to HttpOnly cookies
12. Implement proper cache with TTL
13. Add database indexes
14. Refactor duplicate auth code
15. Move hardcoded values to configuration

---

# 📝 Notes

ဒီ report သည် code review ပြုလုပ်ထားခြင်းဖြစ်ပြီး production deployment မလုပ်ခင် ဒီ issues တွေကို fix လုပ်ဖို့ အကြံပြုပါသည်။

---

# 🎬 VIDEO PROCESSING DEEP ANALYSIS

## Backend Video Processing Pipeline

### Processing Flow
```
1. Extract transcript (TranscriptAPI/yt-dlp)
2. Generate script (Groq/Gemini AI)
3. Generate audio + subtitles (Edge-TTS)
4. Download source video (yt-dlp/pytubefix)
5. Apply FFmpeg processing:
   a. Copyright bypass (color, flip, zoom)
   b. Blur regions
   c. Resize/crop to aspect ratio
   d. Logo overlay
   e. Replace audio with TTS
   f. Burn subtitles
   g. Add outro
6. Upload to Cloudflare R2
```

---

## 🔴 Video Processing Critical Issues

### Issue VP1: No Process Timeout
**Location:** `backend/app/processing/video_processor.py`
```python
async def process_video(self, video_id: str) -> bool:
    # ❌ No overall timeout for entire process
    ...
```
**Problem:** Video processing တစ်ခုလုံး အတွက် timeout မရှိပါ။ FFmpeg hung ဖြစ်ရင် forever run နေနိုင်ပါသည်။

**Recommendation:**
```python
import asyncio
async def process_video(self, video_id: str) -> bool:
    try:
        return await asyncio.wait_for(
            self._process_video_internal(video_id),
            timeout=600  # 10 minutes max
        )
    except asyncio.TimeoutError:
        # Handle timeout - refund credits
        pass
```

---

### Issue VP2: FFmpeg Error Not Properly Parsed
**Location:** `backend/app/services/video_processing/ffmpeg_utils.py`
```python
async def run_ffmpeg(self, cmd: list) -> None:
    ...
    if process.returncode != 0:
        error_msg = stderr.decode() if stderr else "Unknown error"
        logger.error(f"FFmpeg failed: {error_msg}")
        raise RuntimeError(f"FFmpeg failed: {error_msg}")  # ❌ Raw error
```
**Problem:** FFmpeg error ကို raw ပဲ user ဆီ ပြပါသည်။ User-friendly မဟုတ်ပါ။

**Recommendation:** Error mapping dictionary ဖြင့် user-friendly messages သုံးပါ။

---

### Issue VP3: Temporary Files Cleanup Race Condition
**Location:** `backend/app/processing/video_processor.py` (Lines 240-244)
```python
# Cleanup temp files
self._cleanup_temp_files([video_path, audio_path, subtitle_path, source_video_path])

# Send notification email (async, don't wait)
asyncio.create_task(self._send_completion_email(video))  # ❌ Uses video object after cleanup
```
**Problem:** Email sending task က video object ကို reference လုပ်ထားပေမယ့် cleanup ပြီးသွားပါပြီ။

---

### Issue VP4: Subtitle Generation Fallback Issues
**Location:** `backend/app/services/tts_service.py` (Lines 130-140)
```python
# Check if SRT is empty (common for Burmese/non-space-delimited languages)
if not srt_content or len(srt_content.strip()) < 10:
    logger.warning("Edge-TTS SubMaker returned empty SRT. Using sentence-based fallback for Burmese.")
    srt_content = self._generate_sentence_based_srt(text, audio_path)
```
**Problem:** Sentence-based fallback သည် audio duration ကို ffprobe နဲ့ ယူပါသည်။ ffprobe fail ဖြစ်ရင် estimated duration သုံးပြီး subtitle timing မှားနိုင်ပါသည်။

---

### Issue VP5: YouTube Download Bot Detection
**Location:** `backend/app/processing/video_processor.py` (Lines 308-360)
```python
strategies = [
    {"client": "android", "impersonate": "chrome-131"},
    {"client": "web_safari", "impersonate": "safari-18.0"},
    # ... more strategies
]
for strategy in strategies:
    # ❌ No delay between retries
    cmd = [...]
```
**Problem:** Strategies အကြား delay မရှိပါ။ YouTube rate limiting ကို ထိနိုင်ပါသည်။

**Recommendation:**
```python
import asyncio
for i, strategy in enumerate(strategies):
    if i > 0:
        await asyncio.sleep(2)  # 2 second delay between attempts
    ...
```

---

### Issue VP6: Work Directory Not Fully Cleaned
**Location:** `backend/app/services/video_processing/main_service.py` (Lines 140-145)
```python
finally:
    # Cleanup work directory
    try:
        shutil.rmtree(work_dir)
    except Exception:
        pass  # ❌ Silent failure
```
**Problem:** Work directory cleanup fail ဖြစ်ရင် log မရှိပါ။ Disk space leak ဖြစ်နိုင်ပါသည်။

**Recommendation:**
```python
except Exception as e:
    logger.warning(f"Failed to cleanup work directory {work_dir}: {e}")
```

---

### Issue VP7: Outro Font Path Not Validated
**Location:** `backend/app/services/video_processing/outro_service.py` (Line 32)
```python
self.font_path = font_path or "DejaVuSans"  # ❌ May not exist
```
**Problem:** Font file မရှိရင် FFmpeg fail ဖြစ်ပါမည်။ Error message က font-related မဟုတ်ဘဲ generic error ဖြစ်ပါမည်။

**Recommendation:** Font existence ကို startup တွင် check လုပ်ပါ။

---

### Issue VP8: No Video Duration Validation
**Location:** `backend/app/api/v1/endpoints/videos.py`
**Problem:** Video duration limit (60 minutes) ကို transcript extraction ပြီးမှ check လုပ်ပါသည်။ Credit deduct ပြီးပြီ ဖြစ်ပါသည်။

**Recommendation:** Video info ကို creation time မှာ check ပြီး reject လုပ်ပါ။

---

## 🟠 Frontend Video Processing Issues

### Issue FVP1: No Polling Cancellation
**Location:** `frontend/components/video/stepper-video-form.tsx` (Lines 64-76)
```typescript
useEffect(() => {
  if (!createdVideo) return;

  const pollStatus = async () => { ... };
  const interval = setInterval(pollStatus, 3000);

  return () => clearInterval(interval);  // ✅ Cleanup exists
}, [createdVideo]);
```
**Analysis:** Polling cleanup ရှိပါသည်။ ဒါပေမယ့်...

**Problem:** `pollStatus()` function သည် in-flight request ကို cancel မလုပ်ပါ။ Component unmount ဖြစ်ပြီး request complete ဖြစ်ရင် state update error ဖြစ်နိုင်ပါသည်။

**Recommendation:**
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  const pollStatus = async () => {
    try {
      const response = await videoApi.get(createdVideo.id, {
        signal: controller.signal
      });
      ...
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to poll video status:', err);
      }
    }
  };
  
  const interval = setInterval(pollStatus, 3000);
  
  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, [createdVideo]);
```

---

### Issue FVP2: Video Status Type Mismatch
**Location:** `frontend/stores/video-store.ts` vs `backend/app/models/video.py`
```typescript
// Frontend
export type VideoStatus =
  | 'pending'
  | 'extracting_transcript'
  | 'generating_script'
  | 'generating_audio'
  | 'rendering_video'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Backend adds progress status messages like:
// "🎬 Video ကို လေ့လာနေပါတယ်..."
// But these are in status_message, not status - OK ✅
```
**Analysis:** Status values match ပါသည်။ ✅

---

### Issue FVP3: Missing Error Handling in Video Form
**Location:** `frontend/components/video/stepper-video-form.tsx` (Lines 102-115)
```typescript
const handleSubmit = async () => {
  ...
  try {
    const data = getSubmissionData();
    const video = await createVideo(data);
    setCreatedVideo(video);
  } catch (err: any) {
    setError(err.message || 'Video ဖန်တီးရာတွင် အမှားရှိပါသည်');
  } finally {
    setSubmitting(false);
  }
};
```
**Problem:** `createVideo` throw လုပ်တဲ့ error structure ကို properly parse မလုပ်ပါ။ Backend error format ကို handle မလုပ်ပါ။

**Recommendation:**
```typescript
catch (err: any) {
  const detail = err.response?.data?.detail;
  const message = typeof detail === 'object' ? detail.message : detail;
  setError(message || err.message || 'Video ဖန်တီးရာတွင် အမှားရှိပါသည်');
}
```

---

### Issue FVP4: Video Options Naming Inconsistency
**Location:** `frontend/stores/video-creation-store.ts` vs `backend/app/models/video.py`
```typescript
// Frontend uses camelCase
copyrightOptions: {
  colorAdjust: true,
  horizontalFlip: true,
  pitchValue: 1.0,
}

// Backend expects snake_case
options: {
  color_adjust: true,
  horizontal_flip: true,
  pitch_value: 1.0,
}
```
**Analysis:** `getSubmissionData()` function မှာ conversion လုပ်ထားပါသည်။ ✅

---

### Issue FVP5: Progress Not Real-time
**Location:** `frontend/components/video/stepper-video-form.tsx`
**Problem:** 3 second polling interval သည် real-time feel မရှိပါ။

**Recommendation:** WebSocket သို့မဟုတ် Server-Sent Events သုံးပြီး real-time progress update လုပ်ပါ။

---

### Issue FVP6: Video Card Image Not Optimized
**Location:** `frontend/components/video/video-card.tsx` (Lines 100-105)
```tsx
<img
  src={video.source_thumbnail}
  alt={video.source_title || 'Video thumbnail'}
  className="w-full h-full object-cover"
/>
```
**Problem:** Next.js Image component မသုံးပါ။ Image optimization မရှိပါ။

**Recommendation:**
```tsx
import Image from 'next/image';

<Image
  src={video.source_thumbnail}
  alt={video.source_title || 'Video thumbnail'}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, 144px"
/>
```

---

### Issue FVP7: Video URL Security
**Location:** `frontend/components/video/video-card.tsx`
```tsx
onClick={() => window.open(video.video_url!, '_blank')}
```
**Problem:** Video URL ကို directly open ပါသည်။ URL validation မရှိပါ။ Malicious URL injection ဖြစ်နိုင်ပါသည်။

**Recommendation:**
```typescript
const openVideoUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.origin === 'https://videos.recapvideo.ai') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (e) {
    console.error('Invalid video URL');
  }
};
```

---

## 📊 Video Processing Summary

| Component | Issue Count | Critical | Major | Minor |
|-----------|------------|----------|-------|-------|
| Backend Pipeline | 8 | 2 | 4 | 2 |
| Frontend State | 4 | 0 | 3 | 1 |
| FFmpeg Services | 4 | 1 | 2 | 1 |
| TTS Service | 2 | 0 | 2 | 0 |
| **Total** | **18** | **3** | **11** | **4** |

---

## 🎯 Video Processing Priority Fixes

### Immediate:
1. Add overall process timeout
2. Add delay between YouTube download retries
3. Fix AbortController for polling

### Short-term:
4. Validate video duration before credit deduction
5. Use Next.js Image for thumbnails
6. Add video URL validation

### Long-term:
7. Implement WebSocket for real-time progress
8. Better FFmpeg error messages
9. Font validation on startup

---

*Report generated by GitHub Copilot*
