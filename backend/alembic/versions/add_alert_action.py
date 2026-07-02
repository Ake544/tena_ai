"""add action column to alert, add chat_message table

Revision ID: add_alert_action
Revises: add_tip_alert
Create Date: 2026-06-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_alert_action'
down_revision = 'add_tip_alert'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('alert', sa.Column('action', sa.String(), nullable=True))
    op.create_table(
        'chat_message',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_column('alert', 'action')
    op.drop_table('chat_message')
