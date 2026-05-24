"""add glucose_log table

Revision ID: add_glucose_log
Revises: init_patient
Create Date: 2026-05-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_glucose_log'
down_revision = 'init_patient'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'glucose_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('reading_type', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('symptoms', sa.String(), nullable=True),
        sa.Column('synced', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('glucose_log')
