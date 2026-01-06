"""
User Endpoints
"""
from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentActiveUser, DBSession
from app.core.security import verify_password, get_password_hash
from app.schemas.user import UserResponse, UserUpdate, UserPasswordUpdate


router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: CurrentActiveUser):
    """
    Get current authenticated user's profile.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Update current user's profile.
    
    - **name**: Display name (optional)
    - **phone**: Phone number (optional)
    - **avatar_url**: Avatar URL (optional)
    """
    update_data = user_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.flush()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Change current user's password.
    
    - **current_password**: Current password
    - **new_password**: New strong password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.flush()
    
    return {"message": "Password changed successfully"}


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_current_user(
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Deactivate current user's account.
    
    This doesn't actually delete the user, just marks them as inactive.
    """
    current_user.is_active = False
    await db.flush()
    
    return {"message": "Account deactivated successfully"}
