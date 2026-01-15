"""
Storage Service - Cloudflare R2 (S3-compatible)
"""
import os
import uuid
from pathlib import Path
from typing import Optional, BinaryIO

import boto3
from botocore.config import Config
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class StorageService:
    """Service for file storage using Cloudflare R2."""
    
    def __init__(self):
        """Initialize storage service."""
        self._client = None
    
    async def _get_client(self):
        """Lazy-load S3 client for R2 with credentials from database."""
        credentials = await api_key_service.get_r2_credentials()
        
        access_key = credentials.get("access_key") or settings.R2_ACCESS_KEY_ID
        secret_key = credentials.get("secret_key") or settings.R2_SECRET_ACCESS_KEY
        
        if not access_key or not secret_key:
            raise ValueError("R2 credentials not configured")
        
        return boto3.client(
            's3',
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'},
            ),
            region_name='auto',
        )
    
    @property
    def client(self):
        """Sync client using env vars (for backward compatibility)."""
        if self._client is None:
            self._client = boto3.client(
                's3',
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(
                    signature_version='s3v4',
                    s3={'addressing_style': 'path'},
                ),
                region_name='auto',
            )
        return self._client
    
    def get_public_url(self, key: str) -> str:
        """Get public URL for a file."""
        return f"{settings.R2_PUBLIC_URL}/{key}"
    
    async def upload_file(
        self,
        file_path: str,
        key: Optional[str] = None,
        content_type: Optional[str] = None,
        folder: str = "videos",
    ) -> str:
        """
        Upload a file to R2.
        
        Args:
            file_path: Local file path
            key: Optional custom key (filename in bucket)
            content_type: MIME type
            folder: Folder/prefix in bucket
        
        Returns:
            Public URL of uploaded file
        """
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Generate key if not provided
        if not key:
            extension = path.suffix
            key = f"{folder}/{uuid.uuid4()}{extension}"
        
        # Detect content type
        if not content_type:
            extension = path.suffix.lower()
            content_types = {
                '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.webm': 'video/webm',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.vtt': 'text/vtt',
            }
            content_type = content_types.get(extension, 'application/octet-stream')
        
        logger.info(f"Uploading {path.name} to R2: {key}")
        
        try:
            # Get client with credentials from database
            client = await self._get_client()
            
            with open(file_path, 'rb') as f:
                client.upload_fileobj(
                    f,
                    settings.R2_BUCKET_NAME,
                    key,
                    ExtraArgs={
                        'ContentType': content_type,
                    },
                )
            
            url = self.get_public_url(key)
            logger.info(f"Upload complete: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise
    
    async def upload_bytes(
        self,
        data: bytes,
        key: str,
        content_type: str,
    ) -> str:
        """
        Upload bytes to R2.
        
        Args:
            data: Bytes to upload
            key: Key (filename) in bucket
            content_type: MIME type
        
        Returns:
            Public URL of uploaded file
        """
        from io import BytesIO
        
        logger.info(f"Uploading bytes to R2: {key}")
        
        try:
            client = await self._get_client()
            client.upload_fileobj(
                BytesIO(data),
                settings.R2_BUCKET_NAME,
                key,
                ExtraArgs={
                    'ContentType': content_type,
                },
            )
            
            url = self.get_public_url(key)
            logger.info(f"Upload complete: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise
    
    async def delete_file(self, key: str) -> bool:
        """
        Delete a file from R2.
        
        Args:
            key: File key in bucket
        
        Returns:
            True if deleted successfully
        """
        logger.info(f"Deleting from R2: {key}")
        
        try:
            client = await self._get_client()
            client.delete_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
            )
            logger.info(f"Deleted: {key}")
            return True
            
        except Exception as e:
            logger.error(f"Delete failed: {e}")
            return False
    
    def extract_key_from_url(self, url: str) -> Optional[str]:
        """Extract R2 key from public URL."""
        if url.startswith(settings.R2_PUBLIC_URL):
            return url.replace(f"{settings.R2_PUBLIC_URL}/", "")
        return None


# Singleton instance
storage_service = StorageService()
