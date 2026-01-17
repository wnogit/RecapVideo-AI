# 🚀 Single-Pass FFmpeg Optimization Plan

> **Goal**: Video processing time **10+ min → 2-3 min** (3-5x faster)

---

## 📊 Current Architecture (Problem)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CURRENT: 4-Pass Pipeline                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Pass 1: Visual Effects ─────────────┐                             │
│   (copyright, blur, resize, logo)     │                             │
│   └── FFmpeg ENCODE ①                 ├── temp1.mp4 (write to disk) │
│                                       │                             │
│   Pass 2: Audio Merge ────────────────┤                             │
│   (loop video + replace audio)        │                             │
│   └── FFmpeg ENCODE ②                 ├── temp2.mp4 (write to disk) │
│                                       │                             │
│   Pass 3: Subtitle Burn ──────────────┤                             │
│   (ASS subtitles overlay)             │                             │
│   └── FFmpeg ENCODE ③                 ├── temp3.mp4 (write to disk) │
│                                       │                             │
│   Pass 4: Outro Concat ───────────────┤                             │
│   (add ending screen)                 │                             │
│   └── FFmpeg ENCODE ④                 └── final.mp4                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    
⏱️ Total: ~10+ minutes (4x encoding + 4x disk I/O)
```

### ❌ Problems:
1. **4x Re-encoding** - CPU intensive, wastes time
2. **4x Disk I/O** - Write/read temp files each step
3. **Sequential** - Can't parallelize some independent operations

---

## ⚡ Target Architecture (Solution)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NEW: Single-Pass Pipeline                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │                  ONE FFmpeg Command                            │ │
│   │                                                                │ │
│   │   Inputs:                                                      │ │
│   │   [0] source_video.mp4                                         │ │
│   │   [1] tts_audio.mp3                                            │ │
│   │   [2] logo.png                                                 │ │
│   │   [3] outro.mp4 (pre-generated)                                │ │
│   │                                                                │ │
│   │   filter_complex:                                              │ │
│   │   ┌──────────────────────────────────────────────────────┐    │ │
│   │   │ [0:v] loop=N:size=frames,                            │    │ │
│   │   │       hue=s=0.8,                          (copyright) │    │ │
│   │   │       hflip,                              (copyright) │    │ │
│   │   │       scale=1080:1920,                    (resize)    │    │ │
│   │   │       boxblur=...,                        (blur)      │    │ │
│   │   │       subtitles='sub.ass'                 (subtitle)  │    │ │
│   │   │       [main];                                         │    │ │
│   │   │                                                       │    │ │
│   │   │ [2:v] scale=80:-1,format=rgba [logo];                │    │ │
│   │   │ [main][logo] overlay=x:y [with_logo];                │    │ │
│   │   │                                                       │    │ │
│   │   │ [with_logo][3:v] concat=n=2:v=1:a=0 [vout];          │    │ │
│   │   │ [1:a][3:a] concat=n=2:v=0:a=1 [aout]                 │    │ │
│   │   └──────────────────────────────────────────────────────┘    │ │
│   │                                                                │ │
│   │   Output: final.mp4 (ENCODE ① only!)                          │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

⏱️ Total: ~2-3 minutes (1x encoding + 1x disk I/O)
```

---

## 📁 Files to Modify

| File | Changes | Complexity |
|------|---------|------------|
| `main_service.py` | Complete rewrite of `process_video()` | 🔴 High |
| `audio_service.py` | Extract filter logic (no encoding) | 🟡 Medium |
| `subtitle_service.py` | Extract filter logic (no encoding) | 🟡 Medium |
| `outro_service.py` | Pre-generate only, concat in main | 🟡 Medium |
| `copyright_service.py` | Already returns filters ✅ | 🟢 Done |
| `blur_service.py` | Already returns filters ✅ | 🟢 Done |
| `resize_service.py` | Extract filter logic | 🟢 Low |
| `logo_service.py` | Extract filter logic | 🟢 Low |

---

## 🔧 Implementation Steps

### Phase 1: Preparation (Day 1 Morning)
- [ ] **Step 1.1**: Create backup branch
- [ ] **Step 1.2**: Add feature flag `USE_SINGLE_PASS=False`
- [ ] **Step 1.3**: Create `unified_processor.py` (new file)

### Phase 2: Filter Extraction (Day 1 Afternoon)
- [ ] **Step 2.1**: Create `FilterBuilder` class
  ```python
  class FilterBuilder:
      def build_copyright_filter(options) -> str
      def build_blur_filter(options, width, height) -> str
      def build_resize_filter(options) -> str
      def build_subtitle_filter(ass_path) -> str
      def build_logo_overlay(logo_path, options) -> str
  ```
- [ ] **Step 2.2**: Extract filters from each service

### Phase 3: Single-Pass Implementation (Day 1 Evening)
- [ ] **Step 3.1**: Implement video looping logic in filter_complex
- [ ] **Step 3.2**: Implement audio stream handling
- [ ] **Step 3.3**: Implement outro concat in same command
- [ ] **Step 3.4**: Build final FFmpeg command builder

### Phase 4: Testing (Day 2)
- [ ] **Step 4.1**: Test with simple video (no blur, no logo)
- [ ] **Step 4.2**: Test with blur regions
- [ ] **Step 4.3**: Test with logo overlay
- [ ] **Step 4.4**: Test with subtitles (Burmese font)
- [ ] **Step 4.5**: Test with outro
- [ ] **Step 4.6**: Test full pipeline (all features)
- [ ] **Step 4.7**: Test edge cases:
  - Very short video (< 30s)
  - Very long audio (> 5 min)
  - Different aspect ratios (9:16, 16:9, 1:1)

### Phase 5: Deployment (Day 2 Evening)
- [ ] **Step 5.1**: Enable feature flag
- [ ] **Step 5.2**: Deploy to staging
- [ ] **Step 5.3**: Monitor for errors
- [ ] **Step 5.4**: Deploy to production
- [ ] **Step 5.5**: Remove old multi-pass code (after 1 week stable)

---

## 🎯 Key Technical Challenges

### Challenge 1: Video Looping for Long Audio
**Problem**: Audio is 3+ minutes, but source video is 1 minute
**Current**: `AudioService.replace_audio()` loops video separately
**Solution**: Use `-stream_loop -1` with `-shortest` or calculate loop count

```bash
# Method 1: Loop until shortest stream ends
ffmpeg -stream_loop -1 -i video.mp4 -i audio.mp3 -shortest output.mp4

# Method 2: Calculate loop count
loop_count = ceil(audio_duration / video_duration)
ffmpeg -stream_loop {loop_count} -i video.mp4 -t {audio_duration} ...
```

### Challenge 2: Subtitle Timing with Looped Video
**Problem**: Subtitles are timed for original video, but video is looped
**Current**: Works because subtitles are applied after video loop
**Solution**: Same - subtitles filter applies to final looped video timeline

### Challenge 3: Outro Concat with Complex Filters
**Problem**: Can't easily concat with filter_complex output
**Solution Options**:
1. **Option A**: Pre-generate outro, use `concat` filter
2. **Option B**: Keep outro as separate pass (acceptable overhead)

**Recommendation**: Option B for simplicity. Outro is only 3-5 seconds encoding.

### Challenge 4: Audio Pitch Shift
**Problem**: TTS audio needs pitch shifting for copyright bypass
**Current**: Applied during audio merge
**Solution**: Add to audio filter chain: `asetrate=44100*{pitch},aresample=44100`

---

## 📐 New FFmpeg Command Structure

```python
def build_single_pass_command(
    source_video: str,
    audio_path: str,
    subtitle_path: str,  # Already converted to ASS
    logo_path: str,
    output_path: str,
    options: VideoProcessingOptions,
    video_duration: float,
    audio_duration: float,
) -> List[str]:
    
    # Calculate loop count
    loop_count = math.ceil(audio_duration / video_duration)
    
    # Build filter_complex
    video_filters = []
    
    # 1. Copyright filters
    if options.copyright.enabled:
        video_filters.append(f"hue=s={options.copyright.saturation}")
        if options.copyright.horizontal_flip:
            video_filters.append("hflip")
        if options.copyright.zoom != 1.0:
            video_filters.append(f"scale=iw*{options.copyright.zoom}:ih*{options.copyright.zoom}")
    
    # 2. Blur filters (if any)
    if options.blur.enabled:
        for region in options.blur.regions:
            # Complex blur filter...
            pass
    
    # 3. Resize filter
    width, height = ASPECT_RATIOS[options.aspect_ratio]
    video_filters.append(f"scale={width}:{height}:force_original_aspect_ratio=decrease")
    video_filters.append(f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black")
    
    # 4. Subtitle filter
    if subtitle_path:
        video_filters.append(f"subtitles='{subtitle_path}'")
    
    # Build video filter chain
    vf_chain = ",".join(video_filters)
    
    # Audio filter (pitch shift if needed)
    af_chain = ""
    if options.copyright.audio_pitch_shift:
        pitch = options.copyright.pitch_value
        af_chain = f"asetrate=44100*{pitch},aresample=44100"
    
    # Build command
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", str(loop_count),
        "-i", source_video,
        "-i", audio_path,
    ]
    
    # Add logo input if needed
    if logo_path:
        cmd.extend(["-i", logo_path])
    
    # Add filter_complex
    filter_complex = f"[0:v]{vf_chain}[vout]"
    
    if logo_path:
        logo_filter = f"[2:v]scale=80:-1,format=rgba[logo];[vout][logo]overlay=W-w-20:20[vfinal]"
        filter_complex = f"{filter_complex};{logo_filter}"
        video_out = "[vfinal]"
    else:
        video_out = "[vout]"
    
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", video_out,
        "-map", "1:a",
        "-t", str(audio_duration),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "aac",
        output_path
    ])
    
    return cmd
```

---

## 📈 Expected Performance Improvement

| Metric | Current | Single-Pass | Improvement |
|--------|---------|-------------|-------------|
| Encoding passes | 4 | 1 | 4x less CPU |
| Temp files | 3 | 0 | No disk I/O |
| Processing time | ~10 min | ~2-3 min | **3-5x faster** |
| Disk usage | ~500MB temp | ~0MB temp | 100% reduction |

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bug in new code | Keep old code behind feature flag |
| Edge case failures | Extensive testing before deployment |
| Subtitle timing issues | Test with various audio lengths |
| Memory issues | Monitor Docker container memory |
| FFmpeg errors | Add detailed error logging |

---

## 🗓️ Timeline

| Day | Task | Hours |
|-----|------|-------|
| Day 1 AM | Phase 1: Preparation | 2h |
| Day 1 PM | Phase 2: Filter Extraction | 3h |
| Day 1 EVE | Phase 3: Implementation | 4h |
| Day 2 AM | Phase 4: Testing | 4h |
| Day 2 PM | Phase 5: Deployment | 2h |
| **Total** | | **15h** |

---

## ✅ Success Criteria

1. [ ] Video processing completes in < 4 minutes
2. [ ] All features work (blur, logo, subtitle, outro)
3. [ ] No quality degradation
4. [ ] No new bugs in production
5. [ ] Celery tasks don't timeout

---

## 📝 Notes

- **Fallback**: If single-pass fails, can fall back to multi-pass
- **Monitoring**: Add timing logs to compare before/after
- **Future**: Consider GPU encoding (h264_nvenc) for even faster processing

---

*Created: 2026-01-17*
*Author: RecapVideo AI Team*
