"""add taken_times and skipped_times columns to medication

Revision ID: add_taken_skipped_times
Revises: add_medication_appointment
Create Date: 2026-06-08
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_taken_skipped_times'
down_revision = 'add_medication_appointment'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('medication', sa.Column('taken_times', sa.String(), nullable=True))
    op.add_column('medication', sa.Column('skipped_times', sa.String(), nullable=True))


def downgrade():
    op.drop_column('medication', 'skipped_times')
    op.drop_column('medication', 'taken_times')
