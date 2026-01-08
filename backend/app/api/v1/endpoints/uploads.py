"""
File Upload Endpoints
Handle logo and other file uploads to R2 storage
"""
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.dependencies import CurrentActiveUser, DBSession
from app.services.storage_service import storage_service


router = APIRouter()


# Allowed image types for logo
ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"]
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB


class UploadResponse(BaseModel):
    """Response for file upload."""
    url: str
    filename: str
    content_type: str
    size: int


@router.post("/logo", response_model=UploadResponse)
async def upload_logo(
    current_user: CurrentActiveUser,
    db: DBSession,
    file: UploadFile = File(...),
):
    """
    Upload a logo image for video watermark.
    
    - Allowed types: PNG, JPEG, WebP
    - Max size: 2MB
    - Returns the R2 URL for the uploaded logo
    
    The URL can be used in video options:
    ```json
    {
        "options": {
            "logo": {
                "enabled": true,
                "image_url": "<returned_url>"
            }
        }
    }
    ```
    """
    # Validate content type
    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Invalid file type. Allowed: {ALLOWED_LOGO_TYPES}",
            }
        )
    
    # Read file content
    content = await file.read()
    
    # Validate size
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File too large. Max size: {MAX_LOGO_SIZE // (1024*1024)}MB",
            }
        )
    
    # Generate unique filename
    filename = file.filename or "upload.png"
    extension = filename.split(".")[-1] if "." in filename else "png"
    unique_filename = f"{current_user.id}/{uuid.uuid4()}.{extension}"
    
    # Upload to R2
    try:
        url = await storage_service.upload_bytes(
            content,
            key=f"logos/{unique_filename}",
            content_type=file.content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "UPLOAD_FAILED",
                "message": str(e),
            }
        )
    
    return UploadResponse(
        url=url,
        filename=filename,
        content_type=file.content_type,
        size=len(content),
    )


@router.delete("/logo")
async def delete_logo(
    current_user: CurrentActiveUser,
    db: DBSession,
    url: str,
):
    """
    Delete a previously uploaded logo.
    
    - **url**: The R2 URL of the logo to delete
    
    Only the owner can delete their logos.
    """
    # Validate that the URL belongs to this user
    if f"/{current_user.id}/" not in url:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "NOT_AUTHORIZED",
                "message": "You can only delete your own logos",
            }
        )
    
    try:
        await storage_service.delete_file(url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DELETE_FAILED",
                "message": str(e),
            }
        )
    
    return {"message": "Logo deleted successfully"}
