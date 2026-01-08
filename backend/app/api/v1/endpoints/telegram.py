"""
Telegram Webhook Endpoint
Handles callback queries from Telegram inline buttons (approve/reject orders)
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Request, HTTPException, status
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db_session
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.credit import CreditTransaction, TransactionType
from app.services.telegram_service import telegram_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Handle incoming updates from Telegram.
    Processes callback_query for approve/reject button clicks.
    """
    try:
        data = await request.json()
        logger.info(f"Telegram webhook received: {data}")
        
        # Handle callback query (button clicks)
        if "callback_query" in data:
            callback = data["callback_query"]
            callback_id = callback["id"]
            callback_data = callback["data"]
            chat_id = callback["message"]["chat"]["id"]
            message_id = callback["message"]["message_id"]
            user = callback["from"]
            admin_name = user.get("first_name", "Admin")
            
            # Parse callback data
            if callback_data.startswith("approve_"):
                order_id_str = callback_data.replace("approve_", "")
                await process_order_action(
                    order_id_str=order_id_str,
                    callback_id=callback_id,
                    chat_id=chat_id,
                    message_id=message_id,
                    admin_name=admin_name,
                    approved=True,
                )
                
            elif callback_data.startswith("reject_"):
                order_id_str = callback_data.replace("reject_", "")
                await process_order_action(
                    order_id_str=order_id_str,
                    callback_id=callback_id,
                    chat_id=chat_id,
                    message_id=message_id,
                    admin_name=admin_name,
                    approved=False,
                )
            
            return {"ok": True}
        
        return {"ok": True}
        
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}")
        return {"ok": False, "error": str(e)}


async def process_order_action(
    order_id_str: str,
    callback_id: str,
    chat_id: int,
    message_id: int,
    admin_name: str,
    approved: bool,
):
    """Process order approval/rejection from Telegram."""
    try:
        # Parse order ID
        try:
            order_id = UUID(order_id_str)
        except ValueError:
            await telegram_service.answer_callback_query(
                callback_id, "❌ Invalid order ID!", show_alert=True
            )
            return
        
        # Get database session
        async with get_db_session() as db:
            # Get the order
            result = await db.execute(
                select(Order).where(Order.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if not order:
                await telegram_service.answer_callback_query(
                    callback_id, "❌ Order not found!", show_alert=True
                )
                return
            
            if order.status != OrderStatus.PENDING.value:
                await telegram_service.answer_callback_query(
                    callback_id,
                    f"ℹ️ Order already {order.status}!",
                    show_alert=True,
                )
                return
            
            # Get user info
            result = await db.execute(
                select(User).where(User.id == order.user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                await telegram_service.answer_callback_query(
                    callback_id, "❌ User not found!", show_alert=True
                )
                return
            
            now = datetime.now(timezone.utc)
            
            if approved:
                # Approve the order
                order.status = OrderStatus.COMPLETED.value
                order.completed_at = now
                order.admin_note = f"Approved via Telegram by {admin_name}"
                
                # Add credits to user
                user.credit_balance += order.credits_amount
                
                # Create credit transaction
                transaction = CreditTransaction(
                    user_id=user.id,
                    amount=order.credits_amount,
                    type=TransactionType.PURCHASE.value,
                    description=f"Credit purchase approved: {order.credits_amount} credits",
                    order_id=order.id,
                )
                db.add(transaction)
                
                await db.commit()
                
                # Answer callback
                await telegram_service.answer_callback_query(
                    callback_id,
                    f"✅ Order approved! {order.credits_amount} credits added.",
                )
                
                # Edit message to show approved
                new_caption = f"""✅ <b>ORDER APPROVED</b>

👤 <b>User:</b> {user.full_name or user.email}
📧 <b>Email:</b> {user.email}
🎁 <b>Credits:</b> {order.credits_amount:,}
💰 <b>Amount:</b> ${order.price_usd:.2f}

✅ <b>Approved by:</b> {admin_name}
🕐 <b>Time:</b> {now.strftime('%Y-%m-%d %H:%M UTC')}"""
                
                await telegram_service.edit_message(chat_id, message_id, new_caption)
                
            else:
                # Reject the order
                order.status = OrderStatus.REJECTED.value
                order.completed_at = now
                order.admin_note = f"Rejected via Telegram by {admin_name}"
                
                await db.commit()
                
                # Answer callback
                await telegram_service.answer_callback_query(
                    callback_id, "❌ Order rejected."
                )
                
                # Edit message to show rejected
                new_caption = f"""❌ <b>ORDER REJECTED</b>

👤 <b>User:</b> {user.full_name or user.email}
📧 <b>Email:</b> {user.email}
🎁 <b>Credits:</b> {order.credits_amount:,}
💰 <b>Amount:</b> ${order.price_usd:.2f}

❌ <b>Rejected by:</b> {admin_name}
🕐 <b>Time:</b> {now.strftime('%Y-%m-%d %H:%M UTC')}"""
                
                await telegram_service.edit_message(chat_id, message_id, new_caption)
            
            logger.info(f"Order {order_id} {'approved' if approved else 'rejected'} via Telegram by {admin_name}")
        
    except Exception as e:
        logger.error(f"Error processing order {order_id_str}: {e}")
        await telegram_service.answer_callback_query(
            callback_id, f"❌ Error: {str(e)}", show_alert=True
        )
