"""add_todos_table

Revision ID: b55b2a1eb62a
Revises: cdd1bf5a30fc
Create Date: 2025-05-10 20:13:05.671026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b55b2a1eb62a'
down_revision: Union[str, None] = 'cdd1bf5a30fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'todos',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, index=True),
        sa.Column('title', sa.String(), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)
        # If you decide to add profile_id ForeignKey later:
        # sa.Column('profile_id', sa.Integer(), sa.ForeignKey('profiles.id'), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('todos')
