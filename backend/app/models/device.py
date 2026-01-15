"""
Device Fingerprint Model

Tracks device fingerprints for anti-abuse protection.
"""
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class DeviceFingerprint(Base):
    """Device fingerprint tracking for anti-abuse."""
    
    __tablename__ = "device_fingerprints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Fingerprint from FingerprintJS
    fingerprint_id = Column(String(100), index=True, nullable=False)
    
    # User association
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Device info
    browser = Column(String(100), nullable=True)
    browser_version = Column(String(50), nullable=True)
    os = Column(String(100), nullable=True)
    os_version = Column(String(50), nullable=True)
    device_type = Column(String(50), nullable=True)  # desktop, mobile, tablet
    
    # Network info
    ip_address = Column(String(50), nullable=True)
    country = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True)
    isp = Column(String(200), nullable=True)
    
    # Tracking
    first_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    login_count = Column(Integer, default=1)
    
    # Flags
    is_suspicious = Column(Boolean, default=False)
    suspicious_reason = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="devices")
    
    def __repr__(self):
        return f"<DeviceFingerprint {self.fingerprint_id[:8]}... user={self.user_id}>"


class IPSignupLog(Base):
    """Log of signups per IP for rate limiting."""
    
    __tablename__ = "ip_signup_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    ip_address = Column(String(50), index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # IP info at signup time
    country = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True)
    isp = Column(String(200), nullable=True)
    is_vpn = Column(Boolean, default=False)
    is_datacenter = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="ip_logs")
