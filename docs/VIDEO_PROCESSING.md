# Video Processing System

## 📋 Overview

The video processing pipeline transforms YouTube videos into AI-generated recap videos with translated scripts and text-to-speech narration.

---

## 🔄 Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    VIDEO PROCESSING PIPELINE                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │ 1. INPUT    │    │ 2. EXTRACT  │    │ 3. GENERATE SCRIPT  │   │
│  │ YouTube URL │ ──▶│ Transcript  │ ──▶│ (Google Gemini)     │   │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘   │
│                                                    │              │
│                                                    ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │ 6. UPLOAD   │    │ 5. COMBINE  │    │ 4. TEXT-TO-SPEECH   │   │
│  │ to R2      │ ◀──│ Video+Audio │ ◀──│ (Edge-TTS - FREE)   │   │
│  └─────────────┘    └─────────────┘    └─────────────────────┘   │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    7. FINAL OUTPUT                           │ │
│  │  - MP4 video with AI narration                              │ │
│  │  - VTT subtitles                                            │ │
│  │  - Public URL for download                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Processing Stages

### Stage 1: Input Validation
- Validate YouTube URL format
- Extract video ID
- Check video availability
- Estimate credits required

### Stage 2: Transcript Extraction
- **Service**: TranscriptAPI.com
- **Input**: YouTube video ID
- **Output**: Timed transcript segments

```python
# app/services/transcript_service.py
async def get_transcript(video_url: str, language: str = "en") -> dict:
    return {
        "video_id": "abc123",
        "text": "Full transcript text...",
        "segments": [
            {"start": 0.0, "end": 5.0, "text": "Hello..."},
            {"start": 5.0, "end": 10.0, "text": "Welcome..."},
        ],
        "language": "en",
        "duration": 600
    }
```

### Stage 3: Script Generation
- **Service**: Google Gemini Pro
- **Input**: Transcript + target language
- **Output**: Recap script optimized for TTS

```python
# app/services/script_service.py
async def generate_script(
    transcript: str,
    video_title: str,
    target_language: str = "my",  # Burmese
    style: str = "informative",
    max_length: int = 750
) -> str:
    # Uses Gemini to create recap script
    return "Generated script in target language..."
```

### Stage 4: Text-to-Speech
- **Service**: Edge-TTS (Microsoft Neural TTS)
- **Cost**: FREE
- **Input**: Script text + voice selection
- **Output**: MP3 audio + VTT subtitles

```python
# app/services/tts_service.py
VOICES = {
    "my": {
        "female": "my-MM-NilarNeural",  # Burmese female
        "male": "my-MM-ThihaNeural",     # Burmese male
    },
    "en": {
        "female": "en-US-JennyNeural",
        "male": "en-US-GuyNeural",
    },
    "th": {
        "female": "th-TH-PremwadeeNeural",
        "male": "th-TH-NiwatNeural",
    },
}

async def synthesize(text: str, voice: str, language: str) -> tuple[str, str]:
    # Returns (audio_path, subtitle_path)
    pass
```

### Stage 5: Video Composition
- Combine audio with background/visuals
- Add subtitles
- Encode to MP4

### Stage 6: Upload to Storage
- **Service**: Cloudflare R2
- **Output**: Public URL

```python
# app/services/storage_service.py
async def upload_file(file_path: str, folder: str = "videos") -> str:
    # Returns public URL like: https://videos.recapvideo.ai/uuid.mp4
    pass
```

---

## 📡 API Endpoints

### POST `/api/v1/videos`
Create new video processing request.

**Request:**
```json
{
  "source_url": "https://youtube.com/watch?v=abc123",
  "voice_type": "female",
  "output_language": "my",
  "output_resolution": "1080p"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "source_url": "https://youtube.com/watch?v=abc123",
  "output_language": "my",
  "credits_used": 1,
  "created_at": "2024-01-05T10:00:00Z"
}
```

### GET `/api/v1/videos`
List user's videos with pagination.

**Query Parameters:**
- `page` (int): Page number
- `page_size` (int): Items per page
- `status` (string): Filter by status

### GET `/api/v1/videos/{id}`
Get video details.

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "source_url": "https://youtube.com/watch?v=abc123",
  "output_url": "https://videos.recapvideo.ai/uuid.mp4",
  "subtitle_url": "https://videos.recapvideo.ai/uuid.vtt",
  "thumbnail_url": "https://videos.recapvideo.ai/uuid.jpg",
  "title": "How to Learn Python",
  "duration": 180,
  "progress": 100,
  "credits_used": 1,
  "created_at": "2024-01-05T10:00:00Z",
  "completed_at": "2024-01-05T10:05:00Z"
}
```

### GET `/api/v1/videos/{id}/status`
Get video processing status (for polling).

---

## 🗄️ Database Model

```python
# app/models/video.py
class VideoStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    # Input
    source_url = Column(String(500), nullable=False)
    source_video_id = Column(String(50))
    
    # Processing options
    voice_type = Column(String(50), default="female")
    output_language = Column(String(10), default="my")
    output_resolution = Column(String(20), default="1080p")
    
    # Status
    status = Column(String(20), default=VideoStatus.PENDING)
    progress = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Output
    output_url = Column(String(500), nullable=True)
    subtitle_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Metadata
    title = Column(String(500), nullable=True)
    duration = Column(Integer, nullable=True)  # seconds
    
    # Credits
    credits_used = Column(Integer, default=1)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="videos")
```

---

## ⚙️ Background Processing

### Celery Configuration

```python
# app/processing/celery_config.py
from celery import Celery

celery_app = Celery(
    "recapvideo",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)
```

### Video Processing Task

```python
# app/processing/tasks.py
@celery_app.task(bind=True)
def process_video_task(self, video_id: str):
    """
    Main video processing task.
    Updates progress at each stage.
    """
    try:
        # Stage 1: Get transcript (10%)
        self.update_state(state='PROGRESS', meta={'progress': 10})
        transcript = get_transcript(video_id)
        
        # Stage 2: Generate script (30%)
        self.update_state(state='PROGRESS', meta={'progress': 30})
        script = generate_script(transcript)
        
        # Stage 3: Text-to-speech (60%)
        self.update_state(state='PROGRESS', meta={'progress': 60})
        audio_path = synthesize_speech(script)
        
        # Stage 4: Compose video (80%)
        self.update_state(state='PROGRESS', meta={'progress': 80})
        video_path = compose_video(audio_path)
        
        # Stage 5: Upload (100%)
        self.update_state(state='PROGRESS', meta={'progress': 95})
        output_url = upload_to_r2(video_path)
        
        return {'status': 'completed', 'output_url': output_url}
        
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
```

---

## 🖥️ Frontend Components

### Video Form Component
```tsx
// components/video/video-form.tsx
export function VideoForm() {
  const { createVideo, isCreating } = useCreateVideo();
  
  const onSubmit = async (data: VideoFormData) => {
    await createVideo({
      source_url: data.youtubeUrl,
      output_language: data.language,
      voice_type: data.voice,
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input 
        placeholder="Paste YouTube URL" 
        {...register('youtubeUrl')}
      />
      <Select {...register('language')}>
        <SelectItem value="my">Burmese</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </Select>
      <Button type="submit" disabled={isCreating}>
        Generate Video
      </Button>
    </form>
  );
}
```

### Video Card Component
```tsx
// components/video/video-card.tsx
export function VideoCard({ video }: { video: Video }) {
  return (
    <Card>
      <CardHeader>
        <img src={video.thumbnail_url} alt={video.title} />
      </CardHeader>
      <CardContent>
        <h3>{video.title}</h3>
        <Badge variant={getStatusVariant(video.status)}>
          {video.status}
        </Badge>
        {video.status === 'processing' && (
          <Progress value={video.progress} />
        )}
      </CardContent>
      <CardFooter>
        {video.status === 'completed' && (
          <Button asChild>
            <a href={video.output_url} download>Download</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

## 📂 Related Files

### Backend
- `app/services/transcript_service.py` - Transcript extraction
- `app/services/script_service.py` - AI script generation
- `app/services/tts_service.py` - Text-to-speech
- `app/services/storage_service.py` - R2 file storage
- `app/processing/video_processor.py` - Video composition
- `app/processing/tasks.py` - Celery tasks
- `app/models/video.py` - Video model
- `app/api/v1/endpoints/videos.py` - Video endpoints

### Frontend
- `stores/video-store.ts` - Video state management
- `hooks/use-videos.ts` - Video hooks
- `components/video/video-form.tsx` - Video creation form
- `components/video/video-card.tsx` - Video display card
- `app/(dashboard)/videos/page.tsx` - Videos list page
- `app/(dashboard)/page.tsx` - Dashboard with video form
