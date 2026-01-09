"""Add credit_packages and payment_methods tables

Revision ID: 002_add_packages_payments
Revises: 001_add_video_options
Create Date: 2026-01-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_add_packages_payments'
down_revision: Union[str, None] = '001_add_video_options'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create credit_packages table
    op.create_table(
        'credit_packages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('credits', sa.Integer, nullable=False),
        sa.Column('price_usd', sa.Float, nullable=False),
        sa.Column('price_mmk', sa.Float, nullable=True),
        sa.Column('is_popular', sa.Boolean, default=False),
        sa.Column('discount_percent', sa.Integer, default=0),
        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create payment_methods table
    op.create_table(
        'payment_methods',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('account_name', sa.String(100), nullable=False),
        sa.Column('payment_types', postgresql.JSON, nullable=False, server_default='[]'),
        sa.Column('qr_code_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('display_order', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('payment_methods')
    op.drop_table('credit_packages')
