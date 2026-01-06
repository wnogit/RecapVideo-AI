"""
Credits Endpoints
"""
from math import ceil

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.dependencies import CurrentActiveUser, DBSession
from app.models.credit import CreditTransaction, TransactionType
from app.schemas.credit import (
    CreditBalanceResponse,
    CreditTransactionResponse,
    CreditTransactionListResponse,
    CreditPackage,
    CREDIT_PACKAGES,
)


router = APIRouter()


@router.get("/balance", response_model=CreditBalanceResponse)
async def get_credit_balance(
    current_user: CurrentActiveUser,
    db: DBSession,
):
    """
    Get current user's credit balance and summary.
    """
    # Calculate total earned (positive transactions)
    earned_result = await db.execute(
        select(func.coalesce(func.sum(CreditTransaction.amount), 0))
        .where(
            CreditTransaction.user_id == current_user.id,
            CreditTransaction.amount > 0,
        )
    )
    total_earned = earned_result.scalar() or 0
    
    # Calculate total spent (negative transactions)
    spent_result = await db.execute(
        select(func.coalesce(func.abs(func.sum(CreditTransaction.amount)), 0))
        .where(
            CreditTransaction.user_id == current_user.id,
            CreditTransaction.amount < 0,
        )
    )
    total_spent = spent_result.scalar() or 0
    
    return CreditBalanceResponse(
        balance=current_user.credit_balance,
        total_earned=int(total_earned),
        total_spent=int(total_spent),
    )


@router.get("/transactions", response_model=CreditTransactionListResponse)
async def list_credit_transactions(
    current_user: CurrentActiveUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    transaction_type: str = Query(None),
):
    """
    List credit transactions with pagination.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 50)
    - **transaction_type**: Filter by type (optional)
    """
    # Build query
    query = select(CreditTransaction).where(
        CreditTransaction.user_id == current_user.id
    )
    
    if transaction_type:
        query = query.where(CreditTransaction.transaction_type == transaction_type)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get paginated results
    query = query.order_by(CreditTransaction.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return CreditTransactionListResponse(
        transactions=[CreditTransactionResponse.model_validate(t) for t in transactions],
        total=total or 0,
        page=page,
        page_size=page_size,
        total_pages=ceil((total or 0) / page_size),
    )


@router.get("/packages", response_model=list[CreditPackage])
async def get_credit_packages():
    """
    Get available credit packages for purchase.
    """
    return CREDIT_PACKAGES
