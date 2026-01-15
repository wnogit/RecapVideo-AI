"""Site Settings API Endpoints."""
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models import User, SiteSettings, DEFAULT_SETTINGS


router = APIRouter(prefix="/site-settings", tags=["Site Settings"])


# Schemas
class SettingUpdate(BaseModel):
    key: str
    value: Optional[str] = None
    value_json: Optional[list | dict] = None


class SettingResponse(BaseModel):
    key: str
    value: Optional[str] = None
    value_json: Optional[list | dict] = None
    description: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class AllSettingsResponse(BaseModel):
    settings: dict


class MaintenanceStatusResponse(BaseModel):
    maintenance_mode: bool
    is_allowed: bool
    message: Optional[str] = None
    estimated_end: Optional[str] = None


class AllowedIPCreate(BaseModel):
    ip: str
    label: Optional[str] = None


# Helper functions
async def get_setting(db: AsyncSession, key: str) -> Optional[SiteSettings]:
    """Get a single setting by key."""
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
    return result.scalar_one_or_none()


async def get_setting_value(db: AsyncSession, key: str, default: str = None) -> str:
    """Get setting value or default."""
    setting = await get_setting(db, key)
    if setting:
        return setting.value
    if key in DEFAULT_SETTINGS:
        return DEFAULT_SETTINGS[key].get("value", default)
    return default


async def get_setting_json(db: AsyncSession, key: str, default: list | dict = None) -> list | dict:
    """Get JSON setting value or default."""
    setting = await get_setting(db, key)
    if setting and setting.value_json is not None:
        return setting.value_json
    if key in DEFAULT_SETTINGS:
        return DEFAULT_SETTINGS[key].get("value_json", default)
    return default if default is not None else []


async def set_setting(db: AsyncSession, key: str, value: str = None, value_json: list | dict = None, updated_by: str = None):
    """Create or update a setting."""
    setting = await get_setting(db, key)
    if setting:
        if value is not None:
            setting.value = value
        if value_json is not None:
            setting.value_json = value_json
        if updated_by:
            setting.updated_by = updated_by
    else:
        description = DEFAULT_SETTINGS.get(key, {}).get("description", "")
        setting = SiteSettings(
            key=key,
            value=value,
            value_json=value_json,
            description=description,
            updated_by=updated_by
        )
        db.add(setting)
    await db.flush()
    return setting


def get_client_ip(request: Request) -> str:
    """Get client IP from request, handling proxies."""
    # Check X-Forwarded-For header (from nginx/proxy)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    # Check X-Real-IP header
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    # Fall back to direct client
    return request.client.host if request.client else "unknown"


# Public endpoints (for maintenance check)
@router.get("/maintenance-status", response_model=MaintenanceStatusResponse)
async def check_maintenance_status(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if site is in maintenance mode and if current IP is allowed.
    This endpoint is public - no auth required.
    """
    maintenance_mode = await get_setting_value(db, "maintenance_mode", "false")
    is_maintenance = maintenance_mode.lower() == "true"
    
    if not is_maintenance:
        return MaintenanceStatusResponse(
            maintenance_mode=False,
            is_allowed=True
        )
    
    # Get client IP
    client_ip = get_client_ip(request)
    
    # Check if IP is in allowed list
    allowed_ips = await get_setting_json(db, "maintenance_allowed_ips", [])
    
    # allowed_ips can be list of strings or list of objects with 'ip' key
    allowed_ip_list = []
    for item in allowed_ips:
        if isinstance(item, str):
            allowed_ip_list.append(item)
        elif isinstance(item, dict) and 'ip' in item:
            allowed_ip_list.append(item['ip'])
    
    is_allowed = client_ip in allowed_ip_list
    
    message = await get_setting_value(db, "maintenance_message")
    estimated_end = await get_setting_value(db, "maintenance_estimated_end")
    
    return MaintenanceStatusResponse(
        maintenance_mode=True,
        is_allowed=is_allowed,
        message=message,
        estimated_end=estimated_end
    )


@router.get("/public")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """
    Get public settings (for frontend without auth).
    Only returns non-sensitive settings.
    """
    public_keys = [
        "site_name",
        "site_description", 
        "allow_registration",
        "allow_google_login",
        "require_email_verification",
    ]
    
    result = {}
    for key in public_keys:
        value = await get_setting_value(db, key)
        result[key] = value
    
    return {"settings": result}


# Admin endpoints
@router.get("", response_model=AllSettingsResponse)
async def get_all_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all site settings (admin only)."""
    result = await db.execute(select(SiteSettings))
    db_settings = result.scalars().all()
    
    # Start with defaults
    all_settings = {}
    for key, default in DEFAULT_SETTINGS.items():
        all_settings[key] = {
            "value": default.get("value"),
            "value_json": default.get("value_json"),
            "description": default.get("description"),
            "updated_at": None
        }
    
    # Override with DB values
    for setting in db_settings:
        all_settings[setting.key] = {
            "value": setting.value,
            "value_json": setting.value_json,
            "description": setting.description,
            "updated_at": setting.updated_at.isoformat() if setting.updated_at else None
        }
    
    return AllSettingsResponse(settings=all_settings)


@router.put("")
async def update_settings(
    updates: List[SettingUpdate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update multiple settings at once (admin only)."""
    updated = []
    for update in updates:
        setting = await set_setting(
            db, 
            update.key, 
            value=update.value, 
            value_json=update.value_json,
            updated_by=current_user.email
        )
        updated.append(update.key)
    
    await db.commit()
    return {"message": "Settings updated", "updated": updated}


@router.put("/{key}")
async def update_single_setting(
    key: str,
    update: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a single setting (admin only)."""
    await set_setting(
        db,
        key,
        value=update.value,
        value_json=update.value_json,
        updated_by=current_user.email
    )
    await db.commit()
    return {"message": f"Setting '{key}' updated"}


# Maintenance Mode specific endpoints
@router.post("/maintenance/allowed-ips")
async def add_allowed_ip(
    data: AllowedIPCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add an IP to the maintenance allowed list."""
    allowed_ips = await get_setting_json(db, "maintenance_allowed_ips", [])
    
    # Check if IP already exists
    for item in allowed_ips:
        ip = item if isinstance(item, str) else item.get('ip')
        if ip == data.ip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="IP already in allowed list"
            )
    
    # Add new IP
    allowed_ips.append({
        "ip": data.ip,
        "label": data.label or ""
    })
    
    await set_setting(db, "maintenance_allowed_ips", value_json=allowed_ips, updated_by=current_user.email)
    await db.commit()
    
    return {"message": "IP added", "allowed_ips": allowed_ips}


@router.delete("/maintenance/allowed-ips/{ip}")
async def remove_allowed_ip(
    ip: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Remove an IP from the maintenance allowed list."""
    allowed_ips = await get_setting_json(db, "maintenance_allowed_ips", [])
    
    # Filter out the IP
    new_list = []
    found = False
    for item in allowed_ips:
        item_ip = item if isinstance(item, str) else item.get('ip')
        if item_ip != ip:
            new_list.append(item)
        else:
            found = True
    
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP not found in allowed list"
        )
    
    await set_setting(db, "maintenance_allowed_ips", value_json=new_list, updated_by=current_user.email)
    await db.commit()
    
    return {"message": "IP removed", "allowed_ips": new_list}


# ============ Login IP Whitelist (bypass VPN/Datacenter check) ============

@router.post("/login/allowed-ips")
async def add_login_allowed_ip(
    ip: str = Body(..., embed=True),
    label: str = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add an IP to the login whitelist (bypasses VPN/Datacenter check)."""
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    
    # Check if IP already exists
    for item in allowed_ips:
        existing_ip = item if isinstance(item, str) else item.get('ip')
        if existing_ip == ip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="IP already in whitelist"
            )
    
    allowed_ips.append({
        "ip": ip,
        "label": label or "Developer",
        "added_at": datetime.now(timezone.utc).isoformat(),
        "added_by": current_user.email
    })
    
    await set_setting(db, "login_allowed_ips", value_json=allowed_ips, updated_by=current_user.email)
    await db.commit()
    
    return {"message": "IP added to login whitelist", "allowed_ips": allowed_ips}


@router.delete("/login/allowed-ips/{ip}")
async def remove_login_allowed_ip(
    ip: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Remove an IP from the login whitelist."""
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    
    # Filter out the IP
    new_list = []
    found = False
    for item in allowed_ips:
        item_ip = item if isinstance(item, str) else item.get('ip')
        if item_ip != ip:
            new_list.append(item)
        else:
            found = True
    
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP not found in whitelist"
        )
    
    await set_setting(db, "login_allowed_ips", value_json=new_list, updated_by=current_user.email)
    await db.commit()
    
    return {"message": "IP removed from login whitelist", "allowed_ips": new_list}


@router.get("/login/allowed-ips")
async def get_login_allowed_ips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all IPs in login whitelist."""
    allowed_ips = await get_setting_json(db, "login_allowed_ips", [])
    return {"allowed_ips": allowed_ips}


@router.get("/my-ip")
async def get_my_ip(request: Request):
    """Get the current client's IP address (useful for adding to allowed list)."""
    return {"ip": get_client_ip(request)}


# Telegram Configuration endpoints
class TelegramConfigUpdate(BaseModel):
    bot_token: Optional[str] = None
    admin_chat_id: Optional[str] = None
    enabled: Optional[bool] = None


class TelegramWebhookRequest(BaseModel):
    webhook_url: str


@router.get("/telegram/status")
async def get_telegram_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get Telegram bot configuration status.
    Returns bot info, webhook status, and configuration state.
    """
    from app.services.telegram_service import telegram_service
    
    # Check if bot token is configured (from site settings or env)
    bot_token = await get_setting_value(db, "telegram_bot_token", "")
    if not bot_token:
        # Fallback to env
        from app.core.config import settings as app_settings
        bot_token = app_settings.TELEGRAM_BOT_TOKEN or ""
    
    admin_chat_id = await get_setting_value(db, "telegram_admin_chat_id", "")
    enabled = await get_setting_value(db, "telegram_enabled", "false")
    
    result = {
        "bot_token_configured": bool(bot_token),
        "admin_chat_id": admin_chat_id,
        "enabled": enabled.lower() == "true",
        "bot_info": None,
        "webhook_info": None,
    }
    
    if bot_token:
        # Test bot connection
        telegram_service.reset()
        test_result = await telegram_service.test_connection()
        if test_result.get("success"):
            result["bot_info"] = {
                "name": test_result.get("bot_name"),
                "username": test_result.get("bot_username"),
            }
        
        # Get webhook info
        webhook_info = await telegram_service.get_webhook_info()
        result["webhook_info"] = webhook_info
    
    return result


@router.put("/telegram/config")
async def update_telegram_config(
    config: TelegramConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update Telegram notification settings."""
    updates = []
    
    if config.bot_token is not None and config.bot_token.strip():
        await set_setting(db, "telegram_bot_token", value=config.bot_token.strip(), updated_by=current_user.email)
        updates.append("bot_token")
    
    if config.admin_chat_id is not None:
        await set_setting(db, "telegram_admin_chat_id", value=config.admin_chat_id, updated_by=current_user.email)
        updates.append("admin_chat_id")
    
    if config.enabled is not None:
        await set_setting(db, "telegram_enabled", value=str(config.enabled).lower(), updated_by=current_user.email)
        updates.append("enabled")
    
    await db.commit()
    
    # Reset telegram service to reload config
    from app.services.telegram_service import telegram_service
    telegram_service.reset()
    
    return {"message": "Telegram config updated", "updated": updates}


@router.post("/telegram/set-webhook")
async def set_telegram_webhook(
    request: TelegramWebhookRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Set the Telegram webhook URL.
    This should be called after configuring the bot token.
    
    The webhook URL should be: https://api.recapvideo.ai/api/v1/telegram/webhook
    """
    from app.services.telegram_service import telegram_service
    
    # Reset to reload config
    telegram_service.reset()
    
    result = await telegram_service.set_webhook(request.webhook_url)
    
    if result.get("success"):
        return {"message": result.get("message"), "webhook_url": request.webhook_url}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to set webhook")
        )


@router.delete("/telegram/webhook")
async def delete_telegram_webhook(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Remove the Telegram webhook."""
    from app.services.telegram_service import telegram_service
    
    telegram_service.reset()
    result = await telegram_service.delete_webhook()
    
    if result.get("success"):
        return {"message": "Webhook removed"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Failed to remove webhook")
        )


@router.post("/telegram/test")
async def test_telegram_connection(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Test the Telegram bot connection."""
    from app.services.telegram_service import telegram_service
    
    telegram_service.reset()
    result = await telegram_service.test_connection()
    
    if result.get("success"):
        return {
            "success": True,
            "message": result.get("message"),
            "bot_name": result.get("bot_name"),
            "bot_username": result.get("bot_username"),
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Bot connection failed")
        )


@router.post("/telegram/send-test-message")
async def send_test_telegram_message(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Send a test message to the admin chat."""
    from app.services.telegram_service import telegram_service
    
    telegram_service.reset()
    
    message_id = await telegram_service.send_simple_message(
        "🔔 <b>Test Notification</b>\n\n"
        "This is a test message from RecapVideo.AI admin panel.\n"
        f"Sent by: {current_user.email}"
    )
    
    if message_id:
        return {"success": True, "message": "Test message sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send test message. Check bot token and admin chat ID."
        )
