"""add groundedness to edges

Revision ID: 34969732d551
Revises: 48e6306e24ae
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34969732d551'
down_revision: Union[str, Sequence[str], None] = '48e6306e24ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("edges", sa.Column("grounded", sa.Boolean(), nullable=True))
    op.add_column("edges", sa.Column("groundedness_score", sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("edges", "groundedness_score")
    op.drop_column("edges", "grounded")
