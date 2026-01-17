"""Add priority and model fields to api_keys table

Revision ID: 005_add_api_key_priority_and_model
Revises: 004_add_purchased_credits
Create Date: 2026-01-17
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '005_add_api_key_priority_and_model'
down_revision = '004_add_purchased_credits'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add priority field (lower number = higher priority, e.g., 1 is first)
    op.add_column('api_keys', sa.Column('priority', sa.Integer(), nullable=True, server_default='100'))
    
    # Add model field for AI providers
    op.add_column('api_keys', sa.Column('model', sa.String(100), nullable=True))
    
    # Create index on priority for faster ordering
    op.create_index('ix_api_keys_priority', 'api_keys', ['key_type', 'priority', 'is_active'])


def downgrade() -> None:
    op.drop_index('ix_api_keys_priority', table_name='api_keys')
    op.drop_column('api_keys', 'model')
    op.drop_column('api_keys', 'priority')
