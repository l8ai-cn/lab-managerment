"""Initial schema: experiments table."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    experiment_status = postgresql.ENUM(
        "draft",
        "planned",
        "in_progress",
        "paused",
        "completed",
        "failed",
        "cancelled",
        "archived",
        name="experiment_status",
        create_type=False,
    )
    experiment_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "experiments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("hypothesis", sa.Text()),
        sa.Column("status", experiment_status, nullable=False, server_default="draft"),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True)),
        sa.Column("protocol_id", postgresql.UUID(as_uuid=True)),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}"),
        sa.Column("planned_start", sa.DateTime(timezone=True)),
        sa.Column("planned_end", sa.DateTime(timezone=True)),
        sa.Column("actual_start", sa.DateTime(timezone=True)),
        sa.Column("actual_end", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_experiments_code", "experiments", ["code"], unique=True)
    op.create_index("ix_experiments_status", "experiments", ["status"])
    op.create_index("ix_experiments_owner_id", "experiments", ["owner_id"])
    op.create_index("ix_experiments_project_id", "experiments", ["project_id"])


def downgrade() -> None:
    op.drop_table("experiments")
    op.execute("DROP TYPE IF EXISTS experiment_status")
