"""add appointment reminder tracking flags

Revision ID: add_appointment_reminder_flags
Revises: add_device_pending_notification
Create Date: 2026-06-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_appointment_reminder_flags'
down_revision = 'add_device_pending_notification'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('appointment', sa.Column('reminder_7d_sent', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('appointment', sa.Column('reminder_1d_sent', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('appointment', sa.Column('reminder_0d_sent', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade():
    op.drop_column('appointment', 'reminder_0d_sent')
    op.drop_column('appointment', 'reminder_1d_sent')
    op.drop_column('appointment', 'reminder_7d_sent')
