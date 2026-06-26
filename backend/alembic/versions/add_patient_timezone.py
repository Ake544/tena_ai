"""add timezone column to patient

Revision ID: add_patient_timezone
Revises: add_appointment_reminder_flags
Create Date: 2026-06-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_patient_timezone'
down_revision = 'add_appointment_reminder_flags'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('patient', sa.Column('timezone', sa.String(), server_default='Africa/Addis_Ababa', nullable=False))


def downgrade():
    op.drop_column('patient', 'timezone')
