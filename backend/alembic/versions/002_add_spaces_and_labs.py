"""Add spaces and labs tables."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "buildings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("address", sa.String(300)),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_buildings_code", "buildings", ["code"], unique=True)

    op.create_table(
        "floors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("building_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("buildings.id"), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("floor_number", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_floors_building_id", "floors", ["building_id"])

    op.create_table(
        "rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("floor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("floors.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20)),
        sa.Column("area_sqm", sa.Numeric(10, 2)),
        sa.Column("room_type", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_rooms_floor_id", "rooms", ["floor_id"])
    op.create_index("ix_rooms_code", "rooms", ["code"])

    lab_type = postgresql.ENUM(
        "teaching", "research", "comprehensive", "innovation", "training",
        name="lab_type", create_type=False,
    )
    open_status = postgresql.ENUM("open", "closed", "maintenance", name="open_status", create_type=False)
    inspection_status = postgresql.ENUM("normal", "pending", "issue", name="inspection_status", create_type=False)
    lab_type.create(op.get_bind(), checkfirst=True)
    open_status.create(op.get_bind(), checkfirst=True)
    inspection_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "labs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rooms.id")),
        sa.Column("location_detail", sa.String(300)),
        sa.Column("area_sqm", sa.Numeric(10, 2)),
        sa.Column("functional_zones", postgresql.JSONB(), server_default="[]"),
        sa.Column("capacity", sa.Integer()),
        sa.Column("lab_type", lab_type),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True)),
        sa.Column("open_status", open_status, nullable=False, server_default="open"),
        sa.Column("inspection_status", inspection_status, nullable=False, server_default="normal"),
        sa.Column("description", sa.Text()),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_labs_code", "labs", ["code"], unique=True)
    op.create_index("ix_labs_room_id", "labs", ["room_id"])
    op.create_index("ix_labs_open_status", "labs", ["open_status"])
    op.create_index("ix_labs_manager_id", "labs", ["manager_id"])


def downgrade() -> None:
    op.drop_table("labs")
    op.drop_table("rooms")
    op.drop_table("floors")
    op.drop_table("buildings")
    op.execute("DROP TYPE IF EXISTS inspection_status")
    op.execute("DROP TYPE IF EXISTS open_status")
    op.execute("DROP TYPE IF EXISTS lab_type")
