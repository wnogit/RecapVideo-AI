"""
Video Processing - FFmpeg Utilities
Common FFmpeg operations and helpers

VP2 FIX: Added user-friendly error message mapping
"""
import asyncio
import json
import re
from pathlib import Path
from typing import Optional, Tuple

from loguru import logger


# VP2 FIX: User-friendly error messages mapping
FFMPEG_ERROR_MESSAGES = {
    "No such file or directory": "Video file မတွေ့ပါ။ ပြန်လည်ကြိုးစားပါ။",
    "Invalid data found": "Video file ပျက်နေပါသည်။ အခြား video ကို စမ်းကြည့်ပါ။",
    "Permission denied": "File access ခွင့်မရှိပါ။ Admin ကို ဆက်သွယ်ပါ။",
    "No space left on device": "Server disk ပြည့်နေပါသည်။ Admin ကို ဆက်သွယ်ပါ။",
    "Cannot allocate memory": "Server memory မလုံလောက်ပါ။ ခဏစောင့်ပြီး ပြန်လုပ်ပါ။",
    "Avi header": "Video format မမှန်ပါ။ YouTube Shorts URL ကိုသာ သုံးပါ။",
    "moov atom not found": "Video file မပြည့်စုံပါ။ Download ပြန်လုပ်နေပါသည်။",
    "fontfile": "Font file မတွေ့ပါ။ Subtitle မပါဘဲ ဆက်လုပ်ပါမည်။",
    "filter": "Video effect မှားနေပါသည်။ Default settings နဲ့ ပြန်လုပ်ပါမည်။",
    "codec": "Video codec ပြဿနာရှိပါသည်။ ပြန်လည်ကြိုးစားပါ။",
    "Connection refused": "Network ပြဿနာရှိပါသည်။ ခဏစောင့်ပြီး ပြန်လုပ်ပါ။",
    "Conversion failed": "Video conversion မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။",
}


class FFmpegError(Exception):
    """Custom FFmpeg error with user-friendly message."""
    
    def __init__(self, raw_error: str, user_message: str):
        self.raw_error = raw_error
        self.user_message = user_message
        super().__init__(user_message)


class FFmpegUtils:
    """FFmpeg utility functions."""
    
    def __init__(self, ffmpeg_path: str = "ffmpeg", ffprobe_path: str = "ffprobe"):
        self.ffmpeg_path = ffmpeg_path
        self.ffprobe_path = ffprobe_path
    
    def _parse_ffmpeg_error(self, raw_error: str) -> str:
        """
        VP2 FIX: Parse FFmpeg error and return user-friendly message.
        """
        raw_lower = raw_error.lower()
        
        for pattern, message in FFMPEG_ERROR_MESSAGES.items():
            if pattern.lower() in raw_lower:
                return message
        
        # Default message if no pattern matches
        return "Video processing မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။"
    
    async def run_ffmpeg(self, cmd: list, timeout: int = 600) -> None:
        """
        Run FFmpeg command asynchronously with timeout and user-friendly errors.
        
        Args:
            cmd: FFmpeg command as list
            timeout: Maximum execution time in seconds (default 10 minutes)
        """
        logger.debug(f"Running FFmpeg: {' '.join(cmd)}")
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                raise FFmpegError(
                    f"FFmpeg timeout after {timeout}s",
                    "Video processing အချိန်ကြာလွန်းပါသည်။ Video အရှည်ကို စစ်ဆေးပါ။"
                )
            
            if process.returncode != 0:
                raw_error = stderr.decode() if stderr else "Unknown error"
                user_message = self._parse_ffmpeg_error(raw_error)
                logger.error(f"FFmpeg failed: {raw_error}")
                raise FFmpegError(raw_error, user_message)
                
        except FFmpegError:
            raise
        except Exception as e:
            logger.error(f"FFmpeg execution error: {e}")
            raise FFmpegError(str(e), "Video processing မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။")
    
    async def get_duration(self, file_path: str) -> float:
        """Get media file duration in seconds."""
        cmd = [
            self.ffprobe_path,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "json",
            file_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, _ = await process.communicate()
        
        try:
            data = json.loads(stdout.decode())
            return float(data["format"]["duration"])
        except Exception:
            return 0.0
    
    async def get_video_dimensions(self, video_path: str) -> tuple:
        """Get video width and height."""
        try:
            result = await asyncio.create_subprocess_exec(
                self.ffprobe_path, "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "json",
                video_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            probe_data = json.loads(stdout.decode())
            width = probe_data["streams"][0]["width"]
            height = probe_data["streams"][0]["height"]
            return width, height
        except Exception as e:
            logger.warning(f"Failed to probe video dimensions: {e}, using defaults")
            return 1080, 1920


# Default instance
ffmpeg_utils = FFmpegUtils()
