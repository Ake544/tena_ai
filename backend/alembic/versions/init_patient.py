"""create patient table

Revision ID: init_patient
Revises: 
Create Date: 2026-05-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'init_patient'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'patient',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('email_verified', sa.Boolean(), default=False),
        sa.Column('language', sa.String(), default='en'),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('sex', sa.String(), nullable=True),
        sa.Column('bmi', sa.Float(), nullable=True),
        sa.Column('education_level', sa.String(), nullable=True),
        sa.Column('family_history', sa.Boolean(), default=False),
        sa.Column('exercise_habit', sa.String(), nullable=True),
        sa.Column('staple_diet', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('push_token', sa.String(), nullable=True),
        sa.Column('verification_token', sa.String(), nullable=True),
        sa.Column('reset_token', sa.String(), nullable=True),
    )


def downgrade():
    op.drop_table('patient')
