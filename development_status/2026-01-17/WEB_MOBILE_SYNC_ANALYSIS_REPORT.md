# 📊 RecapVideo Web + Mobile API Sync Analysis Report

**ရေးသားသည့်ရက်စွဲ**: January 17, 2026  
**Status**: 🔴 **API Compatibility Issues ရှိနေ**

---

## 📋 အကျဉ်းချုပ် (Summary)

Web Frontend (Next.js) နဲ့ Mobile App (Flutter) ကြားမှာ **API call structure မှားနေတဲ့ ပြဿနာများ** ရှိနေပါတယ်။ Mobile app က video create လုပ်တဲ့အခါ backend ရဲ့ expected format နဲ့ မတူတဲ့ payload ပို့နေပါတယ်။

### 📊 Issues Summary

| Priority | Issue Count | Description |
|----------|-------------|-------------|
| 🔴 P0 (Critical) | 3 | API field names မှား၊ payload structure မှား |
| 🟠 P1 (High) | 3 | Missing fields |
| 🟡 P2 (Medium) | 3 | Default value differences |
| 🔵 P3 (Low) | 2 | Code quality issues |

---

## 🔴 Critical Issues (P0) - ချက်ချင်း ပြင်ရမယ့်

### Issue 1: `voice_id` vs `voice_type` Field Name မှား

**ဖိုင်**: `mobile-app/lib/core/api/video_service.dart` (Line 130)

| Platform | Field Name | Backend Expected |
|----------|------------|------------------|
| **Web** ✅ | `voice_type` | `voice_type` |
| **Mobile** ❌ | `voice_id` | `voice_type` |

**Mobile Code (မှားနေတယ်):**
```dart
Map<String, dynamic> toJson() => {
  'source_url': sourceUrl,
  'voice_id': voiceId,        // ❌ မှား - 'voice_type' ဖြစ်ရမယ်
  ...
};
```

**Web Code (မှန်တယ်):**
```typescript
{
  source_url: state.sourceUrl,
  voice_type: state.voiceId,  // ✅ မှန်
  ...
}
```

---

### Issue 2: `language` vs `output_language` Field Name မှား

**ဖိုင်**: `mobile-app/lib/core/api/video_service.dart` (Line 131)

| Platform | Field Name | Backend Expected |
|----------|------------|------------------|
| **Web** ✅ | `output_language` | `output_language` |
| **Mobile** ❌ | `language` | `output_language` |

---

### Issue 3: Payload Structure မှား (Nested vs Flat)

**Backend Expected Structure:**
```json
{
  "source_url": "...",
  "voice_type": "my-MM-NilarNeural",
  "output_language": "my",
  "options": {                    // ✅ Nested under 'options'
    "aspect_ratio": "9:16",
    "copyright": {...},
    "subtitles": {...},
    "logo": {...},
    "outro": {...},
    "blur": {...}
  }
}
```

**Mobile Sending (မှားနေ):**
```dart
{
  'source_url': '...',
  'voice_id': 'Nilar',           // ❌ Wrong key
  'language': 'my',               // ❌ Wrong key  
  'aspect_ratio': '9:16',         // ❌ Should be inside 'options'
  'copyright_options': {...},     // ❌ Should be 'options.copyright'
  'subtitle_options': {...},      // ❌ Should be 'options.subtitles'
}
```

**ဖိုင်**: `mobile-app/lib/core/api/video_service.dart` (Lines 128-137)

---

## 🟠 High Priority Issues (P1) - Missing Fields

### Issue 4: SubtitleOptions မှာ `word_highlight` မပါ

| Platform | Has Field | Default Value |
|----------|-----------|---------------|
| **Web** ✅ | `word_highlight` | `true` |
| **Mobile** ❌ | Missing | N/A |

**Web Location**: `frontend/lib/types/video-options.ts`
```typescript
export const DEFAULT_SUBTITLE_OPTIONS = {
  ...
  wordHighlight: true,  // ✅ ရှိတယ်
};
```

**Mobile Location**: `mobile-app/lib/features/video_creation/domain/entities/video_creation_options.dart`
```dart
class SubtitleOptions {
  final bool enabled;
  final String position;
  final String size;
  final String background;
  final String color;
  // ❌ wordHighlight မပါ!
}
```

---

### Issue 5: BlurOptions မှာ `blur_type` မပါ

| Platform | Has Field | Default Value |
|----------|-----------|---------------|
| **Web** ✅ | `blurType` | `"gaussian"` |
| **Mobile** ❌ | Missing | N/A |

**Backend expects**: `blur_type` field with value `gaussian` or `box`

---

### Issue 6: Outro မှာ `use_logo` မပါ

| Platform | Has Field | Description |
|----------|-----------|-------------|
| **Web** ✅ | `use_logo` | Use uploaded logo in outro |
| **Mobile** ❌ | Missing | N/A |

---

## 🟡 Medium Priority Issues (P2) - Default Value Differences

### Issue 7: Subtitle Size Default မတူ

| Platform | Default Size |
|----------|--------------|
| **Web** ✅ | `"large"` |
| **Mobile** ❌ | `"medium"` |

**ဖိုင်များ**:
- Web: `frontend/lib/types/video-options.ts` → `size: 'large'`
- Mobile: `mobile-app/.../video_creation_options.dart` → `size = 'medium'`

---

### Issue 8: Voice ID Format မတူ

| Platform | Default Voice ID | Notes |
|----------|------------------|-------|
| **Web** ✅ | `"my-MM-NilarNeural"` | Full Azure TTS format |
| **Mobile** ❌ | `"Nilar"` | Short name only |

**Backend expects**: Full Azure TTS voice name like `my-MM-NilarNeural`

---

### Issue 9: Copyright Options Defaults 

**Good News**: ဒီတစ်ခုက ပြင်ထားပြီး! ✅

| Field | Web Default | Mobile Default | Status |
|-------|-------------|----------------|--------|
| colorAdjust | `false` | `false` | ✅ Match |
| horizontalFlip | `false` | `false` | ✅ Match |
| slightZoom | `false` | `false` | ✅ Match |
| audioPitchShift | `false` | `false` | ✅ Match |

---

## 🔵 Low Priority Issues (P3) - Code Quality

### Issue 10: Hardcoded Voice IDs

Mobile app မှာ voice IDs တွေက hardcoded ဖြစ်နေတယ်:

```dart
this.voiceId = 'Nilar',  // Hardcoded
```

**အကြံပြု**: Constants file မှာ define လုပ်ထားသင့်တယ်

---

### Issue 11: Error Handling Gaps

Mobile API calls မှာ generic error messages သုံးနေတယ်:

```dart
throw Exception('Failed to create video: $e');
```

**အကြံပြု**: Backend error codes ကို properly parse လုပ်ပြီး user-friendly messages ပြသင့်

---

## ✅ Feature Parity Comparison

### 🟢 Both Platforms မှာ ရှိတဲ့ Features
- ✅ YouTube URL validation
- ✅ Voice selection (Nilar, Thiha)
- ✅ Aspect ratio (9:16, 16:9, 1:1, 4:5)
- ✅ Copyright options (colorAdjust, horizontalFlip, slightZoom, audioPitchShift)
- ✅ Subtitle options (enabled, position, size, background, color)
- ✅ Logo options (enabled, position, size, opacity)
- ✅ Outro options (enabled, platform, channelName, duration)
- ✅ Blur regions

### 🟡 Web Only Features
- Word highlight for subtitles
- Blur type selection (gaussian/box)
- Avatar options (cartoon/realistic)
- Effects options (blurBackground, borderStyle, colorFilter)
- Thumbnail options

### 🟡 Mobile Only Features
- Video status polling endpoint
- Live processing progress indicators
- Logo local file path for direct upload

---

## 🛠️ Recommended Fixes

### Fix 1: Update `CreateVideoRequest.toJson()` 

**ဖိုင်**: `mobile-app/lib/core/api/video_service.dart`

```dart
// ❌ အဟောင်း (မှားနေ)
Map<String, dynamic> toJson() => {
  'source_url': sourceUrl,
  'voice_id': voiceId,
  'language': language,
  'aspect_ratio': aspectRatio,
  if (copyrightOptions != null) 'copyright_options': copyrightOptions,
  if (subtitleOptions != null) 'subtitle_options': subtitleOptions,
  if (logoOptions != null) 'logo_options': logoOptions,
  if (outroOptions != null) 'outro_options': outroOptions,
};

// ✅ အသစ် (မှန်ကန်)
Map<String, dynamic> toJson() => {
  'source_url': sourceUrl,
  'voice_type': voiceId,           // Changed!
  'output_language': language,     // Changed!
  'options': {                     // Wrapped in 'options'!
    'aspect_ratio': aspectRatio,
    'copyright': copyrightOptions,  // Changed key!
    'subtitles': subtitleOptions,   // Changed key!
    'logo': logoOptions,            // Changed key!
    'outro': outroOptions,          // Changed key!
    'blur': {
      'enabled': blurRegions?.isNotEmpty ?? false,
      'intensity': blurIntensity,
      'blur_type': 'gaussian',      // Add this!
      'regions': blurRegions,
    },
  },
};
```

---

### Fix 2: Update `SubtitleOptions` Entity

**ဖိုင်**: `mobile-app/lib/features/video_creation/domain/entities/video_creation_options.dart`

```dart
class SubtitleOptions {
  final bool enabled;
  final String position;
  final String size;
  final String background;
  final String color;
  final bool wordHighlight;  // ✅ Add this!

  const SubtitleOptions({
    this.enabled = true,
    this.position = 'bottom',
    this.size = 'large',        // ✅ Change from 'medium'
    this.background = 'semi',
    this.color = '#FFFFFF',
    this.wordHighlight = true,  // ✅ Add this!
  });
}
```

---

### Fix 3: Update Voice ID Default

**ဖိုင်**: `mobile-app/lib/features/video_creation/domain/entities/video_creation_options.dart`

```dart
const VideoCreationOptions({
  this.sourceUrl = '',
  this.voiceId = 'my-MM-NilarNeural',  // ✅ Change from 'Nilar'
  this.language = 'my',
  ...
});
```

---

## 📝 Action Items Summary

| Priority | Issue | Action Required |
|----------|-------|-----------------|
| 🔴 P0 | `voice_id` → `voice_type` | Update `video_service.dart` |
| 🔴 P0 | `language` → `output_language` | Update `video_service.dart` |
| 🔴 P0 | Flat → Nested `options` | Restructure `toJson()` |
| 🟠 P1 | Add `word_highlight` | Update `SubtitleOptions` entity |
| 🟠 P1 | Add `blur_type` | Add to blur options |
| 🟠 P1 | Add `use_logo` in outro | Update `OutroOptions` entity |
| 🟡 P2 | Subtitle size default | Change `'medium'` → `'large'` |
| 🟡 P2 | Voice ID format | Change `'Nilar'` → `'my-MM-NilarNeural'` |

---

## 🚀 Deployment Notes

Mobile app ကို ပြင်ပြီးရင်:

1. **Test Locally**: API calls အားလုံးကို backend နဲ့ test လုပ်ပါ
2. **Version Bump**: `pubspec.yaml` မှာ version update လုပ်ပါ
3. **Build APK**: `flutter build apk --release`
4. **Store Upload**: Google Play / App Store မှာ upload လုပ်ပါ

---

## 📞 ဆက်သွယ်ရန်

ဒီ issues တွေကို fix လုပ်ချင်ရင် ပြောပါ။ ကျွန်တော် mobile app code ကို update လုပ်ပေးပါမယ်။

---

**Report Generated**: 2026-01-17 22:15 (MMT)  
**By**: GitHub Copilot (Claude Opus 4.5)
