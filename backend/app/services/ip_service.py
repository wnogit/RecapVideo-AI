"""
IP Service - VPN/Proxy/Datacenter Detection

Uses ip-api.com (FREE - 45 requests/minute, no API key needed)
"""
import httpx
from typing import Optional
from datetime import datetime, timezone
from loguru import logger

from app.core.config import settings


class IPService:
    """Service for IP validation and VPN/Proxy detection."""
    
    def __init__(self):
        self.api_url = "http://ip-api.com/json"
        self._cache: dict = {}  # Simple in-memory cache
    
    async def check_ip(self, ip: str) -> dict:
        """
        Check if IP is VPN/Proxy/Datacenter.
        
        Args:
            ip: IP address to check
            
        Returns:
            dict with:
            - allowed: bool - whether to allow signup
            - is_vpn: bool - is VPN/Proxy
            - is_datacenter: bool - is datacenter/hosting
            - country: str - country code
            - isp: str - ISP name
            - reason: str - block reason if not allowed
        """
        # Check cache first (cache for 1 hour)
        cache_key = f"ip:{ip}"
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if (datetime.now(timezone.utc) - cached["cached_at"]).seconds < 3600:
                return cached["result"]
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.api_url}/{ip}",
                    params={
                        "fields": "status,message,country,countryCode,region,city,isp,org,as,proxy,hosting,mobile,query"
                    }
                )
                data = response.json()
                
                if data.get("status") != "success":
                    logger.warning(f"IP check failed for {ip}: {data.get('message')}")
                    return {
                        "allowed": True,  # Allow if check fails
                        "reason": "Check failed",
                        "error": True,
                    }
                
                is_proxy = data.get("proxy", False)
                is_hosting = data.get("hosting", False)
                is_suspicious = is_proxy or is_hosting
                
                result = {
                    "ip": ip,
                    "allowed": not is_suspicious,
                    "is_proxy": is_proxy,
                    "is_datacenter": is_hosting,
                    "is_mobile": data.get("mobile", False),
                    "country": data.get("countryCode"),
                    "country_name": data.get("country"),
                    "city": data.get("city"),
                    "isp": data.get("isp"),
                    "org": data.get("org"),
                    "as": data.get("as"),
                    "reason": self._get_block_reason(is_proxy, is_hosting) if is_suspicious else None,
                }
                
                # Cache result
                self._cache[cache_key] = {
                    "result": result,
                    "cached_at": datetime.now(timezone.utc),
                }
                
                if is_suspicious:
                    logger.warning(f"Suspicious IP detected: {ip} - {result['reason']}")
                
                return result
                
        except httpx.TimeoutException:
            logger.error(f"IP check timeout for {ip}")
            return {"allowed": True, "reason": "Timeout", "error": True}
        except Exception as e:
            logger.error(f"IP check error for {ip}: {e}")
            return {"allowed": True, "reason": str(e), "error": True}
    
    def _get_block_reason(self, is_proxy: bool, is_hosting: bool) -> str:
        """Get human-readable block reason."""
        if is_proxy and is_hosting:
            return "VPN/Proxy detected. Please disconnect to continue."
        if is_proxy:
            return "Proxy detected. Please disconnect to continue."
        if is_hosting:
            return "VPN or datacenter connection detected. Please use your regular internet."
        return "Suspicious connection detected."
    
    async def is_allowed(self, ip: str) -> tuple[bool, Optional[str]]:
        """
        Simple check if IP is allowed.
        
        Returns:
            tuple of (allowed: bool, reason: str or None)
        """
        result = await self.check_ip(ip)
        return result["allowed"], result.get("reason")


# Global instance
ip_service = IPService()
