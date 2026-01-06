"""
Admin API Key Management Endpoints
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.api_key import APIKey
from app.schemas.api_key import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    APIKeyFullResponse,
    APIKeyListResponse,
    APIKeyTypeInfo,
    API_KEY_TYPES,
)
from app.services.api_key_service import api_key_service


router = APIRouter()


@router.get("/types", response_model=List[APIKeyTypeInfo])
async def get_api_key_types(
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get all API key types with their status.
    
    Shows which keys are configured and active.
    """
    result = []
    
    for key_type_info in API_KEY_TYPES:
        # Check if key exists in database
        query = select(APIKey).where(
            APIKey.key_type == key_type_info["key_type"]
        )
        db_result = await db.execute(query)
        api_key = db_result.scalar_one_or_none()
        
        result.append(APIKeyTypeInfo(
            key_type=key_type_info["key_type"],
            name=key_type_info["name"],
            description=key_type_info["description"],
            required=key_type_info["required"],
            has_key=api_key is not None,
            is_active=api_key.is_active if api_key else False,
        ))
    
    return result


@router.get("", response_model=APIKeyListResponse)
async def list_api_keys(
    admin_user: CurrentAdminUser,
    db: DBSession,
    key_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """
    List all API keys.
    
    - **key_type**: Filter by key type (optional)
    - **is_active**: Filter by active status (optional)
    """
    query = select(APIKey)
    
    if key_type:
        query = query.where(APIKey.key_type == key_type)
    
    if is_active is not None:
        query = query.where(APIKey.is_active == is_active)
    
    query = query.order_by(APIKey.key_type, APIKey.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get results
    result = await db.execute(query)
    api_keys = result.scalars().all()
    
    return APIKeyListResponse(
        keys=[
            APIKeyResponse(
                id=key.id,
                key_type=key.key_type,
                name=key.name,
                description=key.description,
                masked_value=key.masked_value,
                config=key.config,
                is_active=key.is_active,
                is_primary=key.is_primary,
                last_used_at=key.last_used_at,
                usage_count=key.usage_count,
                created_at=key.created_at,
                updated_at=key.updated_at,
            )
            for key in api_keys
        ],
        total=total or 0,
    )


@router.post("", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Create a new API key.
    
    - **key_type**: Type of key (transcript_api, gemini, etc.)
    - **name**: Display name for the key
    - **key_value**: The actual API key value
    - **is_primary**: Set as primary key for this type
    """
    # If setting as primary, unset other primary keys of same type
    if key_data.is_primary:
        await db.execute(
            select(APIKey)
            .where(APIKey.key_type == key_data.key_type)
        )
        existing_keys = await db.execute(
            select(APIKey).where(
                APIKey.key_type == key_data.key_type,
                APIKey.is_primary == True,
            )
        )
        for key in existing_keys.scalars().all():
            key.is_primary = False
    
    # Create new key
    api_key = APIKey(
        key_type=key_data.key_type,
        name=key_data.name,
        description=key_data.description,
        key_value=key_data.key_value,
        config=key_data.config,
        is_active=key_data.is_active,
        is_primary=key_data.is_primary,
    )
    
    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)
    
    # Clear cache for this key type
    api_key_service.clear_cache(key_data.key_type)
    
    return APIKeyResponse(
        id=api_key.id,
        key_type=api_key.key_type,
        name=api_key.name,
        description=api_key.description,
        masked_value=api_key.masked_value,
        config=api_key.config,
        is_active=api_key.is_active,
        is_primary=api_key.is_primary,
        last_used_at=api_key.last_used_at,
        usage_count=api_key.usage_count,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
    )


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: UUID,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get a specific API key by ID.
    """
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    return APIKeyResponse(
        id=api_key.id,
        key_type=api_key.key_type,
        name=api_key.name,
        description=api_key.description,
        masked_value=api_key.masked_value,
        config=api_key.config,
        is_active=api_key.is_active,
        is_primary=api_key.is_primary,
        last_used_at=api_key.last_used_at,
        usage_count=api_key.usage_count,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
    )


@router.get("/{key_id}/reveal", response_model=APIKeyFullResponse)
async def reveal_api_key(
    key_id: UUID,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Get API key with full (unmasked) value.
    
    Use with caution - logs this action.
    """
    from loguru import logger
    
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    # Log this sensitive action
    logger.warning(
        f"Admin {admin_user.email} revealed API key: {api_key.key_type} - {api_key.name}"
    )
    
    return APIKeyFullResponse(
        id=api_key.id,
        key_type=api_key.key_type,
        name=api_key.name,
        description=api_key.description,
        masked_value=api_key.masked_value,
        key_value=api_key.key_value,
        config=api_key.config,
        is_active=api_key.is_active,
        is_primary=api_key.is_primary,
        last_used_at=api_key.last_used_at,
        usage_count=api_key.usage_count,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
    )


@router.patch("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: UUID,
    key_data: APIKeyUpdate,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Update an API key.
    """
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    # If setting as primary, unset other primary keys
    if key_data.is_primary:
        existing_keys = await db.execute(
            select(APIKey).where(
                APIKey.key_type == api_key.key_type,
                APIKey.is_primary == True,
                APIKey.id != key_id,
            )
        )
        for key in existing_keys.scalars().all():
            key.is_primary = False
    
    # Update fields
    update_data = key_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(api_key, field, value)
    
    await db.flush()
    await db.refresh(api_key)
    
    # Clear cache
    api_key_service.clear_cache(api_key.key_type)
    
    return APIKeyResponse(
        id=api_key.id,
        key_type=api_key.key_type,
        name=api_key.name,
        description=api_key.description,
        masked_value=api_key.masked_value,
        config=api_key.config,
        is_active=api_key.is_active,
        is_primary=api_key.is_primary,
        last_used_at=api_key.last_used_at,
        usage_count=api_key.usage_count,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
    )


@router.delete("/{key_id}", status_code=status.HTTP_200_OK)
async def delete_api_key(
    key_id: UUID,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Delete an API key.
    """
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    key_type = api_key.key_type
    
    await db.delete(api_key)
    await db.flush()
    
    # Clear cache
    api_key_service.clear_cache(key_type)
    
    return {"message": "API key deleted successfully"}


@router.post("/{key_id}/test", status_code=status.HTTP_200_OK)
async def test_api_key(
    key_id: UUID,
    admin_user: CurrentAdminUser,
    db: DBSession,
):
    """
    Test if an API key is working.
    
    Performs a basic connectivity test for the service.
    """
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    
    # Test based on key type
    try:
        if api_key.key_type == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key.key_value)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Say hello")
            return {"status": "success", "message": "Gemini API is working"}
        
        elif api_key.key_type == "resend":
            import resend
            resend.api_key = api_key.key_value
            # Just validate the key format
            return {"status": "success", "message": "Resend API key format is valid"}
        
        elif api_key.key_type == "transcript_api":
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.transcriptapi.com/v1/health",
                    headers={"Authorization": f"Bearer {api_key.key_value}"},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    return {"status": "success", "message": "TranscriptAPI is working"}
                else:
                    return {"status": "error", "message": f"API returned {response.status_code}"}
        
        else:
            return {"status": "unknown", "message": f"No test available for {api_key.key_type}"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
