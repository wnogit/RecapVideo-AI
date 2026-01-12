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
from app.services.telegram_service import telegram_service, format_myanmar_time

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
                    balance_after=user.credit_balance,
                    transaction_type=TransactionType.PURCHASE.value,
                    description=f"Credit purchase approved: {order.credits_amount} credits",
                    reference_type="order",
                    reference_id=str(order.id),
                )
                db.add(transaction)
                
                await db.commit()
                
                # Answer callback
                await telegram_service.answer_callback_query(
                    callback_id,
                    f"✅ Order approved! {order.credits_amount} credits added.",
                )
                
                # Edit message to show approved
                mmk_display = f" ({order.price_mmk:,.0f} MMK)" if order.price_mmk else ""
                action_time = format_myanmar_time(now)
                order_received_time = format_myanmar_time(order.created_at) if order.created_at else action_time
                new_caption = f"""━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>ORDER APPROVED</b>
━━━━━━━━━━━━━━━━━━━━━━━

📦 <b>Order ID:</b> <code>{order.id}</code>
👤 <b>User:</b> {user.name or user.email}
📧 <b>Email:</b> {user.email}

💰 <b>Amount:</b> ${order.price_usd:.2f}{mmk_display}
💎 <b>Credits:</b> {order.credits_amount:,}

📅 <b>Order Received:</b> {order_received_time}
━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Approved by:</b> {admin_name}
⏰ <b>Approved at:</b> {action_time}"""
                
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
                mmk_display = f" ({order.price_mmk:,.0f} MMK)" if order.price_mmk else ""
                action_time = format_myanmar_time(now)
                order_received_time = format_myanmar_time(order.created_at) if order.created_at else action_time
                new_caption = f"""━━━━━━━━━━━━━━━━━━━━━━━
❌ <b>ORDER REJECTED</b>
━━━━━━━━━━━━━━━━━━━━━━━

📦 <b>Order ID:</b> <code>{order.id}</code>
👤 <b>User:</b> {user.name or user.email}
📧 <b>Email:</b> {user.email}

💰 <b>Amount:</b> ${order.price_usd:.2f}{mmk_display}
💎 <b>Credits:</b> {order.credits_amount:,}

📅 <b>Order Received:</b> {order_received_time}
━━━━━━━━━━━━━━━━━━━━━━━
❌ <b>Rejected by:</b> {admin_name}
⏰ <b>Rejected at:</b> {action_time}"""
                
                await telegram_service.edit_message(chat_id, message_id, new_caption)
            
            logger.info(f"Order {order_id} {'approved' if approved else 'rejected'} via Telegram by {admin_name}")
        
    except Exception as e:
        logger.error(f"Error processing order {order_id_str}: {e}")
        await telegram_service.answer_callback_query(
            callback_id, f"❌ Error: {str(e)}", show_alert=True
        )
