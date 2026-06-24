"""add device and pending_notification tables

Revision ID: add_device_pending_notification
Revises: add_symptom_log
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_device_pending_notification'
down_revision = 'add_symptom_log'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'device',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('push_token', sa.String(), nullable=False),
        sa.Column('device_id', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        'pending_notification',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('push_token', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('data_json', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('max_retries', sa.Integer(), default=3),
        sa.Column('last_error', sa.String(), nullable=True),
        sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('pending_notification')
    op.drop_table('device')
