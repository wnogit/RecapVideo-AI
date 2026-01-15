"""Add video options JSONB column

Revision ID: 001_add_video_options
Revises: 
Create Date: 2025-01-15

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_add_video_options'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Default video options
DEFAULT_VIDEO_OPTIONS = {
    "aspect_ratio": "9:16",
    "copyright": {
        "color_adjust": True,
        "horizontal_flip": True,
        "slight_zoom": False,
        "audio_pitch_shift": True,
    },
    "subtitles": {
        "enabled": True,
        "font": "Pyidaungsu",
        "size": "large",
        "position": "bottom",
        "background": "semi",
        "color": "#FFFFFF",
        "word_highlight": True,
    },
    "logo": {
        "enabled": False,
        "image_url": None,
        "position": "top-right",
        "size": "medium",
        "opacity": 70,
    },
    "outro": {
        "enabled": False,
        "platform": "youtube",
        "channel_name": "",
        "use_logo": False,
        "duration": 5,
    },
}


def upgrade() -> None:
    # Add options column to videos table
    op.add_column(
        'videos',
        sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    
    # Update existing videos with default options
    default_json = json.dumps(DEFAULT_VIDEO_OPTIONS)
    op.execute(
        f"""
        UPDATE videos 
        SET options = '{default_json}'::jsonb
        WHERE options IS NULL
        """
    )


def downgrade() -> None:
    # Remove options column
    op.drop_column('videos', 'options')
