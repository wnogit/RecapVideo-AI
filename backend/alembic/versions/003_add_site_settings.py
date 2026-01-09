"""Add site_settings table

Revision ID: 003
Revises: 002
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'site_settings',
        sa.Column('key', sa.String(100), primary_key=True, index=True),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('value_json', sa.JSON(), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('site_settings')
