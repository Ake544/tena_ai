"""add symptom_log table

Revision ID: add_symptom_log
Revises: add_taken_skipped_times
Create Date: 2026-06-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_symptom_log'
down_revision = 'add_taken_skipped_times'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'symptom_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('severity', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('symptom_log')
