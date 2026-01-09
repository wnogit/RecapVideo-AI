"""Site Settings Model."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, JSON
from app.core.database import Base


class SiteSettings(Base):
    """Site-wide settings stored as key-value pairs."""
    __tablename__ = "site_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    value_json = Column(JSON, nullable=True)  # For complex settings like arrays
    description = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100), nullable=True)  # Admin who last updated

    def __repr__(self):
        return f"<SiteSettings(key={self.key})>"


# Default settings
DEFAULT_SETTINGS = {
    # Maintenance Mode
    "maintenance_mode": {
        "value": "false",
        "description": "Enable maintenance mode for the site"
    },
    "maintenance_allowed_ips": {
        "value_json": [],
        "description": "List of IP addresses allowed during maintenance"
    },
    "maintenance_message": {
        "value": "We're working on something amazing! Check back soon.",
        "description": "Custom message shown on maintenance page"
    },
    "maintenance_estimated_end": {
        "value": None,
        "description": "Estimated end time for maintenance (ISO format)"
    },
    
    # Registration & Auth
    "allow_registration": {
        "value": "true",
        "description": "Allow new user registrations"
    },
    "require_email_verification": {
        "value": "true", 
        "description": "Require email verification for new accounts"
    },
    "allow_google_login": {
        "value": "true",
        "description": "Allow Google OAuth login"
    },
    
    # Site Info
    "site_name": {
        "value": "RecapVideo AI",
        "description": "Site name displayed in UI"
    },
    "site_description": {
        "value": "Transform YouTube videos into engaging recap content with AI",
        "description": "Site description for SEO"
    },
    
    # Notifications
    "notify_new_registration": {
        "value": "true",
        "description": "Send notification on new user registration"
    },
    "notify_new_order": {
        "value": "true",
        "description": "Send notification on new order"
    },
    "notify_order_payment": {
        "value": "true",
        "description": "Send notification on order payment submission"
    },
}
