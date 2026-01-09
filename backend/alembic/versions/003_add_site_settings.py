"""Add site_settings table

Revision ID: 003_add_site_settings
Revises: 002_add_packages_payments
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '003_add_site_settings'
down_revision = '002_add_packages_payments'
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
