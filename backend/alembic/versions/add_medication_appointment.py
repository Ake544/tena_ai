"""add medication and appointment tables

Revision ID: add_medication_appointment
Revises: add_glucose_log
Create Date: 2026-06-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_medication_appointment'
down_revision = 'add_glucose_log'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'medication',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('dose', sa.String(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('times', sa.String(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('taken_today', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'appointment',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patient.id'), nullable=False, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('hospital', sa.String(), nullable=False),
        sa.Column('appointment_type', sa.String(), nullable=True),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('appointment')
    op.drop_table('medication')
