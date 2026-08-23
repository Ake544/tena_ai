"""add diagnosis_date, diabetes_type, other_conditions to patient

Revision ID: add_patient_history_fields
Revises: add_family_history_details
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_patient_history_fields'
down_revision = 'add_family_history_details'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('patient', sa.Column('diagnosis_date', sa.Date(), nullable=True))
    op.add_column('patient', sa.Column('diabetes_type', sa.Integer(), nullable=True))
    op.add_column('patient', sa.Column('other_conditions', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('patient', 'other_conditions')
    op.drop_column('patient', 'diabetes_type')
    op.drop_column('patient', 'diagnosis_date')