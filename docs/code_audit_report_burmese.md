# RecapVideo.AI - Code Quality Audit Report
## Issue, Error, False Logic, Unused Code Analysis - မြန်မာဘာသာ

---

## 📋 အကျဉ်းချုပ်

| Category | Web App | Mobile App |
|----------|---------|------------|
| **TODO Items** | 1 | 12 |
| **Debug Logs** | 3 console.log | 35+ print() |
| **Duplicate Code** | - | 2 locale providers |
| **Hardcoded Values** | 2 files | - |
| **Disabled Features** | - | Security packages |

---

## 🔴 Critical Issues (ချက်ချင်း ပြင်ရမည်)

### 1. Duplicate Locale/Language Providers (Mobile)

**ပြဿနာ:** နှစ်ခု provider files သည် တူညီသော functionality ရှိနေသည်

| File | Location |
|------|----------|
| `locale_provider.dart` | `lib/core/providers/` |
| `language_provider.dart` | `lib/core/providers/` |

**Analysis:**

```dart
// locale_provider.dart
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

// language_provider.dart  
final languageProvider = StateNotifierProvider<LanguageNotifier, AppLanguage>((ref) {
  return LanguageNotifier();
});
```

**ပြဿနာများ:**
- နှစ်ခုလုံး SharedPreferences တွင် locale save
- `locale_provider.dart` မှာ key: `app_locale`
- `language_provider.dart` မှာ key: `app_language`
- Data inconsistency ဖြစ်နိုင်သည်

**ပြင်ဆင်နည်း:**
- တစ်ခုကို ဖျက်ပြီး အသုံးပြုနေသော ခုကို update

---

### 2. Disabled Security Packages (Mobile)

**File:** `lib/core/security/device_security_service.dart`

```dart
// TODO: Uncomment when packages are fixed
// flutter_jailbreak_detection: ^1.10.0
// safe_device: ^1.1.5
```

**ပြဿနာ:**
- Root/Jailbreak detection disabled
- Production app ၌ security risk ရှိနိုင်

**Reference:** `pubspec.yaml` (lines 49-51)
```yaml
# Security (Temporarily disabled - namespace issue)
# flutter_jailbreak_detection: ^1.10.0
# safe_device: ^1.1.5
```

---

## 🟠 Medium Priority Issues

### 3. Unimplemented TODO Features (Mobile - 12 items)

| Feature | File | Line |
|---------|------|------|
| Upload API | `logo_upload_widget.dart` | 52 |
| Download Video | `complete_view_widget.dart` | 130 |
| Blur Position Preset | `blur_region_editor.dart` | 165 |
| Download Video | `video_card.dart` | 141 |
| Share Video | `video_detail_screen.dart` | 308 |
| Delete API | `video_detail_screen.dart` | 650 |
| Ad Action URL | `home_slide_ads.dart` | 115 |
| Avatar Upload | `profile_screen.dart` | 383, 405 |
| SSL Pinning | `ssl_pinning.dart` | 14 |

**Example Code (video_detail_screen.dart:650):**
```dart
// TODO: Call delete API
onPressed: () {
  Navigator.pop(context);
  // API call missing here
},
```

---

### 4. Unimplemented TODO (Web - 1 item)

**File:** `frontend/app/(dashboard)/profile/page.tsx` (Line 329)

```typescript
// TODO: Call API to update profile
```

---

### 5. Debug Logging in Production Code

#### Mobile App (35+ print statements)

**Files ပါဝင်သည်:**
- `auth_provider.dart` (12 lines)
- `login_screen.dart` (8 lines)
- `auth_repository.dart` (6 lines)
- `app_config.dart` (9 lines)

**Example:**
```dart
// auth_provider.dart
print('🚀 Auth Initialize started (offline-first)...');
print('🔑 Stored token: ${token != null ? "exists" : "null"}');
print('❌ ApiError during validation: ${e.message}');
```

**ပြဿနာ:**
- Production build တွင် sensitive info log ဖြစ်နိုင်
- Performance impact

**ပြင်ဆင်နည်း:**
```dart
// Use debugPrint or kDebugMode check
if (kDebugMode) {
  debugPrint('🚀 Auth Initialize...');
}
```

---

#### Web App (3 console.log statements)

**File:** `stores/video-creation-store.ts`
```typescript
// Line 159
console.log('[VideoCreationStore] Setting aspect ratio:', ratio);
// Line 243
console.log('[VideoCreationStore] getSubmissionData - aspectRatio:', state.aspectRatio);
```

**File:** `components/video/steps/step1-input.tsx`
```typescript
// Line 367
console.log('[Step1] User clicked aspect ratio:', format.value);
```

---

### 6. Hardcoded localhost References

**Files:**

| File | Purpose |
|------|---------|
| `frontend/middleware.ts` | localhost check for dev |
| `frontend/lib/api.ts` | API base URL fallback |

**lib/api.ts:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

**Recommendation:** Production build ၌ fallback ကို remove/update

---

## 🟡 Low Priority Issues

### 7. SSL Certificate Fingerprint Not Set

**File:** `lib/core/api/ssl_pinning.dart` (Line 14)

```dart
/// TODO: Production certificate fingerprint ထည့်ပါ
static const List<String> allowedFingerprints = [];
```

**Note:** Production deploy မလုပ်မီ fingerprint ထည့်ရန်

---

### 8. Firebase Messaging Disabled

**File:** `pubspec.yaml` (line 55)

```yaml
# firebase_messaging: ^14.7.9  # TODO: Uncomment for mobile build
```

**Note:** Push notification အတွက် uncomment ရန် လိုအပ်

---

## 🟢 Code Quality Observations

### ✅ Good Practices Found

1. **Proper Error Handling**
   - ApiClient has error interceptor
   - Auth flow catches specific error types (ApiError, DioException)

2. **Environment Configuration**
   - `app_config.dart` properly uses `fromEnvironment()`
   - Feature flags for production vs development

3. **State Management**
   - Zustand (Web) - proper middleware usage
   - Riverpod (Mobile) - clean provider structure

4. **Offline-First Auth**
   - Mobile auth caches user data
   - Handles network errors gracefully

---

## 🛠️ Recommended Actions

### Priority 1 (ချက်ချင်း)

- [ ] Remove duplicate `locale_provider.dart` OR `language_provider.dart`
- [ ] Implement video download/share/delete APIs
- [ ] Replace `print()` with `debugPrint()` in kDebugMode check

### Priority 2 (ဒုတိယ)

- [ ] Enable security packages after fixing namespace
- [ ] Set SSL pinning fingerprint for production
- [ ] Implement profile update API (web)
- [ ] Implement logo upload API (mobile)

### Priority 3 (တတိယ)

- [ ] Remove console.log statements
- [ ] Enable firebase_messaging for push notifications
- [ ] Add action URL handler for ads

---

## 📊 Files Summary

### Web App (`frontend/`)

| Issue Type | Count |
|------------|-------|
| TODO items | 1 |
| console.log | 3 |
| Hardcoded values | 2 |

### Mobile App (`mobile-app/lib/`)

| Issue Type | Count |
|------------|-------|
| TODO items | 12 |
| print() statements | 35+ |
| Duplicate providers | 2 |
| Disabled packages | 2 |

---

*Report generated: 2026-01-18*
*Auditor: Code Quality Audit System*
