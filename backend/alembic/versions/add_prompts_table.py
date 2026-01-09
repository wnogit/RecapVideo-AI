"""add prompts table

Revision ID: add_prompts_table
Revises: 
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_prompts_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'prompts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False, server_default='other'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_prompts_key', 'prompts', ['key'], unique=True)
    op.create_index('ix_prompts_category', 'prompts', ['category'])
    op.create_index('ix_prompts_is_active', 'prompts', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_prompts_is_active', table_name='prompts')
    op.drop_index('ix_prompts_category', table_name='prompts')
    op.drop_index('ix_prompts_key', table_name='prompts')
    op.drop_table('prompts')
