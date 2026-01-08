"""
Telegram Bot Service for Credit Order Notifications
Sends order notifications to admin with approve/reject inline buttons
"""

import logging
from typing import Optional
from uuid import UUID

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class TelegramService:
    """Service for sending Telegram notifications."""
    
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.admin_chat_id = settings.TELEGRAM_ADMIN_CHAT_ID
        self.api_base = f"https://api.telegram.org/bot{self.bot_token}"
    
    @property
    def is_configured(self) -> bool:
        """Check if Telegram is properly configured."""
        return bool(self.bot_token and self.admin_chat_id)
    
    async def send_order_notification(
        self,
        order_id: UUID,
        username: str,
        email: str,
        package_name: str,
        credits: int,
        amount_usd: float,
        amount_mmk: Optional[float],
        payment_method: str,
        screenshot_url: Optional[str] = None,
    ) -> Optional[int]:
        """
        Send credit order notification to admin with inline approve/reject buttons.
        
        Returns:
            message_id if sent successfully, None otherwise
        """
        if not self.is_configured:
            logger.warning("Telegram not configured, skipping notification")
            return None
        
        try:
            # Format the message
            amount_display = f"${amount_usd:.2f}"
            if amount_mmk:
                amount_display += f" ({amount_mmk:,.0f} MMK)"
            
            message = f"""
🛒 <b>New Credit Order!</b>

👤 <b>User:</b> {username}
📧 <b>Email:</b> {email}

📦 <b>Package:</b> {package_name}
🎁 <b>Credits:</b> {credits:,}
💰 <b>Amount:</b> {amount_display}
💳 <b>Payment:</b> {payment_method.upper()}

🆔 <b>Order ID:</b> <code>{order_id}</code>
"""
            
            # Inline keyboard with approve/reject buttons
            inline_keyboard = {
                "inline_keyboard": [
                    [
                        {"text": "✅ Approve", "callback_data": f"approve_{order_id}"},
                        {"text": "❌ Reject", "callback_data": f"reject_{order_id}"}
                    ]
                ]
            }
            
            async with httpx.AsyncClient() as client:
                # First try to send with screenshot if available
                if screenshot_url:
                    photo_url = screenshot_url
                    if not photo_url.startswith('http'):
                        photo_url = f"{settings.R2_PUBLIC_URL}{screenshot_url}"
                    
                    response = await client.post(
                        f"{self.api_base}/sendPhoto",
                        json={
                            "chat_id": self.admin_chat_id,
                            "photo": photo_url,
                            "caption": message,
                            "parse_mode": "HTML",
                            "reply_markup": inline_keyboard,
                        },
                        timeout=30.0,
                    )
                    
                    result = response.json()
                    
                    if result.get("ok"):
                        message_id = result["result"]["message_id"]
                        logger.info(f"Telegram notification sent for order {order_id}, message_id: {message_id}")
                        return message_id
                    else:
                        logger.warning(f"Photo send failed: {result}, trying text message")
                        message += f"\n\n📸 <a href='{photo_url}'>View Payment Screenshot</a>"
                
                # Send as text message if no screenshot or photo failed
                response = await client.post(
                    f"{self.api_base}/sendMessage",
                    json={
                        "chat_id": self.admin_chat_id,
                        "text": message,
                        "parse_mode": "HTML",
                        "reply_markup": inline_keyboard,
                    },
                    timeout=30.0,
                )
                
                result = response.json()
                
                if result.get("ok"):
                    message_id = result["result"]["message_id"]
                    logger.info(f"Telegram text notification sent for order {order_id}, message_id: {message_id}")
                    return message_id
                else:
                    logger.error(f"Failed to send Telegram notification: {result}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error sending Telegram notification: {e}")
            return None
    
    async def answer_callback_query(
        self,
        callback_query_id: str,
        text: str,
        show_alert: bool = False,
    ) -> bool:
        """Answer the callback query to remove loading state."""
        if not self.is_configured:
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/answerCallbackQuery",
                    json={
                        "callback_query_id": callback_query_id,
                        "text": text,
                        "show_alert": show_alert,
                    },
                    timeout=10.0,
                )
                return response.json().get("ok", False)
        except Exception as e:
            logger.error(f"Error answering callback query: {e}")
            return False
    
    async def edit_message(
        self,
        chat_id: int,
        message_id: int,
        text: str,
    ) -> bool:
        """Edit the message caption/text after action."""
        if not self.is_configured:
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                # Try editMessageCaption first (for photo messages)
                response = await client.post(
                    f"{self.api_base}/editMessageCaption",
                    json={
                        "chat_id": chat_id,
                        "message_id": message_id,
                        "caption": text,
                        "parse_mode": "HTML",
                    },
                    timeout=10.0,
                )
                
                result = response.json()
                
                if result.get("ok"):
                    return True
                
                # If editMessageCaption fails, try editMessageText (for text messages)
                response = await client.post(
                    f"{self.api_base}/editMessageText",
                    json={
                        "chat_id": chat_id,
                        "message_id": message_id,
                        "text": text,
                        "parse_mode": "HTML",
                    },
                    timeout=10.0,
                )
                
                return response.json().get("ok", False)
                
        except Exception as e:
            logger.error(f"Error editing message: {e}")
            return False
    
    async def send_simple_message(self, text: str) -> Optional[int]:
        """Send a simple text message to admin."""
        if not self.is_configured:
            return None
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/sendMessage",
                    json={
                        "chat_id": self.admin_chat_id,
                        "text": text,
                        "parse_mode": "HTML",
                    },
                    timeout=10.0,
                )
                
                result = response.json()
                
                if result.get("ok"):
                    return result["result"]["message_id"]
                return None
                
        except Exception as e:
            logger.error(f"Error sending simple message: {e}")
            return None


# Singleton instance
telegram_service = TelegramService()
