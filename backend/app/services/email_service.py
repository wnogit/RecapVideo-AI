"""
Email Service - Using Resend
"""
from typing import Optional, List
from loguru import logger

from app.core.config import settings
from app.services.api_key_service import api_key_service


class EmailService:
    """Service for sending emails via Resend."""
    
    def __init__(self):
        """Initialize email service."""
        pass
    
    async def _get_client(self):
        """Get Resend client with API key from database."""
        import resend
        
        api_key = await api_key_service.get_resend_key()
        if not api_key:
            raise ValueError("Resend API key not configured")
        
        resend.api_key = api_key
        return resend
    
    async def send_email(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        from_email: Optional[str] = None,
    ) -> bool:
        """
        Send an email.
        
        Args:
            to: Recipient email(s)
            subject: Email subject
            html: HTML content
            text: Plain text content (optional)
            from_email: Sender email (optional, uses default)
        
        Returns:
            True if sent successfully
        """
        from_email = from_email or settings.RESEND_FROM_EMAIL
        
        if isinstance(to, str):
            to = [to]
        
        logger.info(f"Sending email to {to}: {subject}")
        
        try:
            client = await self._get_client()
            response = client.emails.send({
                "from": from_email,
                "to": to,
                "subject": subject,
                "html": html,
                "text": text,
            })
            
            logger.info(f"Email sent: {response}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_welcome_email(self, to: str, name: str) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to RecapVideo.AI! 🎬"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Welcome to RecapVideo.AI!</h1>
            <p>Hi {name},</p>
            <p>Thank you for joining RecapVideo.AI! We're excited to have you on board.</p>
            <p>You've received <strong>3 free credits</strong> to get started. Each credit allows you to create one recap video.</p>
            <p>Get started by:</p>
            <ol>
                <li>Find a YouTube video you want to create a recap for</li>
                <li>Paste the URL in our video creator</li>
                <li>Choose your voice and language preferences</li>
                <li>Let our AI do the magic!</li>
            </ol>
            <p>
                <a href="https://studio.recapvideo.ai" 
                   style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Start Creating
                </a>
            </p>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Happy creating!</p>
            <p>The RecapVideo.AI Team</p>
        </div>
        """
        
        return await self.send_email(to, subject, html)
    
    async def send_verification_email(self, to: str, name: str, token: str) -> bool:
        """Send email verification link."""
        subject = "Verify Your Email - RecapVideo.AI"
        
        verify_url = f"https://app.recapvideo.ai/verify?token={token}"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Verify Your Email</h1>
            <p>Hi {name},</p>
            <p>Thank you for signing up for RecapVideo.AI! Please verify your email address to activate your account.</p>
            <p>
                <a href="{verify_url}" 
                   style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Verify Email
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">{verify_url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>The RecapVideo.AI Team</p>
        </div>
        """
        
        return await self.send_email(to, subject, html)
    
    async def send_password_reset_email(self, to: str, reset_token: str) -> bool:
        """Send password reset email."""
        subject = "Reset Your Password - RecapVideo.AI"
        
        reset_url = f"https://studio.recapvideo.ai/reset-password?token={reset_token}"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Password Reset Request</h1>
            <p>You requested to reset your password for RecapVideo.AI.</p>
            <p>Click the button below to set a new password:</p>
            <p>
                <a href="{reset_url}" 
                   style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Reset Password
                </a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>The RecapVideo.AI Team</p>
        </div>
        """
        
        return await self.send_email(to, subject, html)
    
    async def send_video_complete_email(
        self,
        to: str,
        name: str,
        video_title: str,
        video_url: str,
    ) -> bool:
        """Send email when video processing is complete."""
        subject = f"Your Video is Ready! - {video_title}"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Your Video is Ready! 🎉</h1>
            <p>Hi {name},</p>
            <p>Great news! Your recap video "<strong>{video_title}</strong>" is ready to view and download.</p>
            <p>
                <a href="https://studio.recapvideo.ai/videos" 
                   style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Your Video
                </a>
            </p>
            <p>Thanks for using RecapVideo.AI!</p>
            <p>The RecapVideo.AI Team</p>
        </div>
        """
        
        return await self.send_email(to, subject, html)


# Singleton instance
email_service = EmailService()
