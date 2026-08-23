"""add hba1c to patient

Revision ID: add_hba1c
Revises: add_patient_history_fields
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_hba1c'
down_revision = 'add_patient_history_fields'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('patient', sa.Column('hba1c', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('patient', 'hba1c')