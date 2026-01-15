"""
Video Processing - FFmpeg Utilities
Common FFmpeg operations and helpers
"""
import asyncio
import json
from pathlib import Path
from typing import Optional

from loguru import logger


class FFmpegUtils:
    """FFmpeg utility functions."""
    
    def __init__(self, ffmpeg_path: str = "ffmpeg", ffprobe_path: str = "ffprobe"):
        self.ffmpeg_path = ffmpeg_path
        self.ffprobe_path = ffprobe_path
    
    async def run_ffmpeg(self, cmd: list) -> None:
        """Run FFmpeg command asynchronously with thread limiting."""
        logger.debug(f"Running FFmpeg: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"FFmpeg failed: {error_msg}")
            raise RuntimeError(f"FFmpeg failed: {error_msg}")
    
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
