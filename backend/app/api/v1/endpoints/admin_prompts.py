"""
Admin Prompts Endpoints
"""
from math import ceil
from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func, or_
from pydantic import BaseModel

from app.core.dependencies import CurrentAdminUser, DBSession
from app.models.prompt import Prompt, PromptCategory


router = APIRouter()


class PromptCreate(BaseModel):
    """Create prompt request."""
    name: str
    key: str
    description: Optional[str] = None
    content: str
    category: str = "other"
    is_active: bool = True


class PromptUpdate(BaseModel):
    """Update prompt request."""
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class PromptResponse(BaseModel):
    """Prompt response."""
    id: str
    name: str
    key: str
    description: Optional[str] = None
    content: str
    category: str
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    """List response for prompts."""
    prompts: list[PromptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PromptCategoryInfo(BaseModel):
    """Prompt category info."""
    value: str
    label: str


@router.get("/categories", response_model=list[PromptCategoryInfo])
async def get_categories(
    current_user: CurrentAdminUser,
):
    """
    Get available prompt categories.
    """
    return [
        PromptCategoryInfo(value=cat.value, label=cat.value.replace("_", " ").title())
        for cat in PromptCategory
    ]


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    db: DBSession,
    current_user: CurrentAdminUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
):
    """
    List all prompts (Admin only).
    
    - **search**: Search by name, key, or description
    - **category**: Filter by category
    - **is_active**: Filter by active status
    """
    # Base query
    query = select(Prompt)
    count_query = select(func.count(Prompt.id))
    
    # Search filter
    if search:
        search_filter = or_(
            Prompt.name.ilike(f"%{search}%"),
            Prompt.key.ilike(f"%{search}%"),
            Prompt.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Category filter
    if category:
        query = query.where(Prompt.category == category)
        count_query = count_query.where(Prompt.category == category)
    
    # Active filter
    if is_active is not None:
        query = query.where(Prompt.is_active == is_active)
        count_query = count_query.where(Prompt.is_active == is_active)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Sorting
    query = query.order_by(Prompt.category, Prompt.name)
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    prompts = result.scalars().all()
    
    return PromptListResponse(
        prompts=[
            PromptResponse(
                id=str(p.id),
                name=p.name,
                key=p.key,
                description=p.description,
                content=p.content,
                category=p.category,
                is_active=p.is_active,
                version=p.version,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in prompts
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Create a new prompt (Admin only).
    """
    # Check for duplicate key
    existing = await db.execute(
        select(Prompt).where(Prompt.key == prompt_data.key)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prompt with key '{prompt_data.key}' already exists",
        )
    
    # Validate category
    valid_categories = [cat.value for cat in PromptCategory]
    if prompt_data.category not in valid_categories:
        prompt_data.category = PromptCategory.OTHER.value
    
    # Create prompt
    prompt = Prompt(
        name=prompt_data.name,
        key=prompt_data.key,
        description=prompt_data.description,
        content=prompt_data.content,
        category=prompt_data.category,
        is_active=prompt_data.is_active,
    )
    
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    
    return PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        key=prompt.key,
        description=prompt.description,
        content=prompt.content,
        category=prompt.category,
        is_active=prompt.is_active,
        version=prompt.version,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Get prompt by ID (Admin only).
    """
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    
    return PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        key=prompt.key,
        description=prompt.description,
        content=prompt.content,
        category=prompt.category,
        is_active=prompt.is_active,
        version=prompt.version,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.get("/by-key/{key}", response_model=PromptResponse)
async def get_prompt_by_key(
    key: str,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Get prompt by key (Admin only).
    """
    result = await db.execute(
        select(Prompt).where(Prompt.key == key)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt with key '{key}' not found",
        )
    
    return PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        key=prompt.key,
        description=prompt.description,
        content=prompt.content,
        category=prompt.category,
        is_active=prompt.is_active,
        version=prompt.version,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.patch("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: UUID,
    update_data: PromptUpdate,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Update prompt (Admin only).
    """
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    
    # Update fields
    if update_data.name is not None:
        prompt.name = update_data.name
    if update_data.description is not None:
        prompt.description = update_data.description
    if update_data.content is not None:
        prompt.content = update_data.content
        prompt.version += 1  # Increment version on content change
    if update_data.category is not None:
        valid_categories = [cat.value for cat in PromptCategory]
        if update_data.category in valid_categories:
            prompt.category = update_data.category
    if update_data.is_active is not None:
        prompt.is_active = update_data.is_active
    
    await db.commit()
    await db.refresh(prompt)
    
    return PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        key=prompt.key,
        description=prompt.description,
        content=prompt.content,
        category=prompt.category,
        is_active=prompt.is_active,
        version=prompt.version,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.post("/{prompt_id}/toggle", response_model=PromptResponse)
async def toggle_prompt(
    prompt_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Toggle prompt active status (Admin only).
    """
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    
    prompt.is_active = not prompt.is_active
    
    await db.commit()
    await db.refresh(prompt)
    
    return PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        key=prompt.key,
        description=prompt.description,
        content=prompt.content,
        category=prompt.category,
        is_active=prompt.is_active,
        version=prompt.version,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: UUID,
    db: DBSession,
    current_user: CurrentAdminUser,
):
    """
    Delete prompt (Admin only).
    """
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    
    await db.delete(prompt)
    await db.commit()
    
    return {"message": "Prompt deleted successfully"}
