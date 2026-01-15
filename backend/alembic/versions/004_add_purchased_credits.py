"""add purchased_credits field to users

Revision ID: 004_add_purchased_credits
Revises: add_prompts_table
Create Date: 2026-01-11 19:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_purchased_credits'
down_revision: Union[str, None] = 'add_prompts_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add purchased_credits field to users table for Pro tier logic."""
    # Add purchased_credits column with default 0
    op.add_column('users', sa.Column('purchased_credits', sa.Integer(), nullable=False, server_default='0'))
    
    # Update existing users: if they have > 4 credits (more than free trial), mark as purchased
    # This is a migration heuristic - users with 5+ credits likely purchased them
    op.execute("""
        UPDATE users 
        SET purchased_credits = GREATEST(credit_balance - 4, 0)
        WHERE credit_balance > 4
    """)


def downgrade() -> None:
    """Remove purchased_credits field."""
    op.drop_column('users', 'purchased_credits')
