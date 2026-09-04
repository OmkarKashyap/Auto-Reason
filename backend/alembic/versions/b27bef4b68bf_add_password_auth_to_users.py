"""add password auth to users

Revision ID: b27bef4b68bf
Revises: d33077453fcd
Create Date: 2026-09-03 16:20:45.757757

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b27bef4b68bf'
down_revision: Union[str, Sequence[str], None] = 'd33077453fcd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    op.create_unique_constraint("uq_users_email", "users", ["email"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_column("users", "password_hash")
