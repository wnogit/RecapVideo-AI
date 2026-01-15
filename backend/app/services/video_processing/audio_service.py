"""
Video Processing - Audio Service
Audio replacement and pitch shifting
"""
from pathlib import Path
from loguru import logger

from .ffmpeg_utils import FFmpegUtils


class AudioService:
    """
    Service for audio processing.
    Replaces video audio with TTS, handles pitch shifting and video looping.
    
    Video Format Info:
    - Audio codec: AAC
    - Bitrate: 192kbps
    - Supports pitch shift: 0.5x - 1.5x
    """
    
    def __init__(self, ffmpeg_utils: FFmpegUtils):
        self.ffmpeg = ffmpeg_utils
    
    async def replace_audio(
        self,
        video_path: str,
        audio_path: str,
        pitch_shift: bool,
        pitch_value: float,
        work_dir: Path,
    ) -> str:
        """
        Replace video audio with TTS audio, looping video if needed.
        
        Video Format:
        - If audio > video: Video is looped to match audio length
        - Audio codec: AAC @ 192kbps
        - Pitch shift: Uses asetrate filter
        """
        output_path = work_dir / "with_audio.mp4"
        
        # Get durations
        video_duration = await self.ffmpeg.get_duration(video_path)
        audio_duration = await self.ffmpeg.get_duration(audio_path)
        
        logger.info(f"Video duration: {video_duration}s, Audio duration: {audio_duration}s")
        
        # If audio is longer than video, loop video to match audio length
        current_video = video_path
        if audio_duration > video_duration:
            logger.info(f"Audio longer than video, looping video to match audio length")
            looped_path = work_dir / "looped_video.mp4"
            
            # Calculate how many times to loop
            loop_count = int(audio_duration / video_duration) + 1
            
            # Create looped video using stream_loop
            loop_cmd = [
                self.ffmpeg.ffmpeg_path, "-y",
                "-stream_loop", str(loop_count),
                "-i", video_path,
                "-t", str(audio_duration + 1),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-an",
                str(looped_path)
            ]
            await self.ffmpeg.run_ffmpeg(loop_cmd)
            current_video = str(looped_path)
        
        # Build command
        if pitch_shift:
            # Apply pitch shift with user-defined value (0.5-1.5x)
            audio_filter = f"asetrate=44100*{pitch_value},aresample=44100"
            logger.info(f"Applying pitch shift: {pitch_value}x")
            cmd = [
                self.ffmpeg.ffmpeg_path, "-y",
                "-i", current_video,
                "-i", audio_path,
                "-filter_complex", f"[1:a]{audio_filter}[a]",
                "-map", "0:v",
                "-map", "[a]",
                "-c:v", "copy" if current_video == video_path else "libx264",
                "-c:a", "aac",
                "-b:a", "192k",
                "-t", str(audio_duration),
                str(output_path)
            ]
        else:
            cmd = [
                self.ffmpeg.ffmpeg_path, "-y",
                "-i", current_video,
                "-i", audio_path,
                "-map", "0:v",
                "-map", "1:a",
                "-c:v", "copy" if current_video == video_path else "libx264",
                "-c:a", "aac",
                "-b:a", "192k",
                "-t", str(audio_duration),
                str(output_path)
            ]
        
        await self.ffmpeg.run_ffmpeg(cmd)
        return str(output_path)
