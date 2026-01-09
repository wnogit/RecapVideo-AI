"""
User Sessions Endpoints

Allows users to view and manage their login sessions/devices.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, desc
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import CurrentUser, DBSession
from app.models.user import User
from app.models.device import DeviceFingerprint


router = APIRouter()


class SessionResponse(BaseModel):
    """Response for a single session."""
    id: str
    device_type: Optional[str] = None
    browser: Optional[str] = None
    browser_version: Optional[str] = None
    os: Optional[str] = None
    os_version: Optional[str] = None
    ip_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    login_count: int = 0
    is_current: bool = False

    class Config:
        from_attributes = True


class SessionsListResponse(BaseModel):
    """Response for list of sessions."""
    sessions: List[SessionResponse]
    total: int


@router.get("/my-sessions", response_model=SessionsListResponse)
async def get_my_sessions(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get all login sessions for the current user.
    """
    result = await db.execute(
        select(DeviceFingerprint)
        .where(DeviceFingerprint.user_id == current_user.id)
        .order_by(desc(DeviceFingerprint.last_seen))
    )
    devices = result.scalars().all()
    
    sessions = []
    for i, device in enumerate(devices):
        # Mask IP address for privacy (show first two octets)
        masked_ip = None
        if device.ip_address:
            parts = device.ip_address.split(".")
            if len(parts) == 4:
                masked_ip = f"{parts[0]}.{parts[1]}.xxx.xxx"
            else:
                masked_ip = device.ip_address
        
        sessions.append(SessionResponse(
            id=str(device.id),
            device_type=device.device_type,
            browser=device.browser,
            browser_version=device.browser_version,
            os=device.os,
            os_version=device.os_version,
            ip_address=masked_ip,
            city=device.city,
            country=device.country,
            first_seen=device.first_seen,
            last_seen=device.last_seen,
            login_count=device.login_count or 0,
            is_current=(i == 0),  # First one (most recent) is current
        ))
    
    return SessionsListResponse(
        sessions=sessions,
        total=len(sessions),
    )


@router.delete("/my-sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Revoke a specific session.
    """
    result = await db.execute(
        select(DeviceFingerprint)
        .where(
            DeviceFingerprint.id == session_id,
            DeviceFingerprint.user_id == current_user.id,
        )
    )
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    
    await db.delete(device)
    await db.flush()
    
    return {"message": "Session revoked successfully"}


@router.delete("/my-sessions")
async def revoke_other_sessions(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Revoke all sessions except the current one.
    """
    # Get the most recent session (current)
    result = await db.execute(
        select(DeviceFingerprint)
        .where(DeviceFingerprint.user_id == current_user.id)
        .order_by(desc(DeviceFingerprint.last_seen))
        .limit(1)
    )
    current_session = result.scalar_one_or_none()
    
    if not current_session:
        return {"message": "No sessions to revoke", "revoked_count": 0}
    
    # Get all other sessions
    other_result = await db.execute(
        select(DeviceFingerprint)
        .where(
            DeviceFingerprint.user_id == current_user.id,
            DeviceFingerprint.id != current_session.id,
        )
    )
    other_sessions = other_result.scalars().all()
    
    revoked_count = 0
    for session in other_sessions:
        await db.delete(session)
        revoked_count += 1
    
    await db.flush()
    
    return {
        "message": f"Revoked {revoked_count} other sessions",
        "revoked_count": revoked_count,
    }
