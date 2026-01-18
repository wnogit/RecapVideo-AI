"""
Add platform field to videos table

Revision ID: add_platform_field
Create Date: 2026-01-18
"""
from alembic import op
import sqlalchemy as sa


# Revision identifiers
revision = 'add_platform_field'
down_revision = '005_add_api_key_priority_and_model'  # Chain after priority/model migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add platform and source_video_id columns to videos table."""
    # Add platform column with default
    op.add_column(
        'videos',
        sa.Column(
            'platform',
            sa.String(20),
            nullable=False,
            server_default='youtube'
        )
    )
    
    # Add source_video_id column (generic ID for any platform)
    op.add_column(
        'videos',
        sa.Column(
            'source_video_id',
            sa.String(50),
            nullable=True
        )
    )
    
    # Create index on platform for filtering
    op.create_index('ix_videos_platform', 'videos', ['platform'])
    
    # Create index on source_video_id for lookups
    op.create_index('ix_videos_source_video_id', 'videos', ['source_video_id'])
    
    # Update existing rows: set platform to 'youtube' and copy youtube_id to source_video_id
    op.execute(
        "UPDATE videos SET platform = 'youtube', source_video_id = youtube_id WHERE platform IS NULL OR platform = ''"
    )


def downgrade() -> None:
    """Remove platform and source_video_id columns."""
    op.drop_index('ix_videos_source_video_id', 'videos')
    op.drop_index('ix_videos_platform', 'videos')
    op.drop_column('videos', 'source_video_id')
    op.drop_column('videos', 'platform')
