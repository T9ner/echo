"""Merge migration heads

Revision ID: 7e28c66b7bc8
Revises: 001, add_performance_indexes
Create Date: 2025-08-10 04:49:28.828107

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7e28c66b7bc8'
down_revision = ('001', 'add_performance_indexes')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass