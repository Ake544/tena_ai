"""add family_history_details column to patient

Revision ID: add_family_history_details
Revises: add_alert_action
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_family_history_details'
down_revision = 'add_alert_action'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('patient', sa.Column('family_history_details', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('patient', 'family_history_details')
