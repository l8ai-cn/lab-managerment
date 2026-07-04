"""Add users, lab_staff, lab_changes tables."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = postgresql.ENUM(
        "system_admin", "dept_admin", "lab_admin", "teacher", "student", "guest",
        name="user_role", create_type=False,
    )
    change_type = postgresql.ENUM(
        "function_adjustment", "manager_change", "equipment_change", "zone_adjustment",
        name="change_type", create_type=False,
    )
    change_request_status = postgresql.ENUM(
        "draft", "pending_unit", "pending_center", "approved", "rejected",
        name="change_request_status", create_type=False,
    )
    approval_node = postgresql.ENUM("unit", "center", name="approval_node", create_type=False)
    approval_action = postgresql.ENUM("approve", "reject", name="approval_action", create_type=False)

    for enum_type in (user_role, change_type, change_request_status, approval_node, approval_action):
        enum_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("employee_no", sa.String(30)),
        sa.Column("phone", sa.String(20)),
        sa.Column("role", user_role, nullable=False, server_default="teacher"),
        sa.Column("department", sa.String(200)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_employee_no", "users", ["employee_no"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "lab_staff",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("employee_no", sa.String(30), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("office_location", sa.String(200)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_lab_staff_employee_no", "lab_staff", ["employee_no"], unique=True)
    op.create_index("ix_lab_staff_user_id", "lab_staff", ["user_id"])

    op.create_table(
        "lab_staff_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_staff.id"), nullable=False),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("staff_id", "lab_id", name="uq_staff_lab"),
    )
    op.create_index("ix_lab_staff_assignments_staff_id", "lab_staff_assignments", ["staff_id"])
    op.create_index("ix_lab_staff_assignments_lab_id", "lab_staff_assignments", ["lab_id"])

    op.create_table(
        "lab_change_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id"), nullable=False),
        sa.Column("applicant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("change_type", change_type, nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("change_content", postgresql.JSONB(), server_default="{}"),
        sa.Column("status", change_request_status, nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_change_requests_lab_id", "lab_change_requests", ["lab_id"])
    op.create_index("ix_lab_change_requests_applicant_id", "lab_change_requests", ["applicant_id"])
    op.create_index("ix_lab_change_requests_status", "lab_change_requests", ["status"])

    op.create_table(
        "lab_change_approval_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_change_requests.id"), nullable=False),
        sa.Column("approver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("node", approval_node, nullable=False),
        sa.Column("action", approval_action, nullable=False),
        sa.Column("comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_change_approval_records_request_id", "lab_change_approval_records", ["request_id"])


def downgrade() -> None:
    op.drop_table("lab_change_approval_records")
    op.drop_table("lab_change_requests")
    op.drop_table("lab_staff_assignments")
    op.drop_table("lab_staff")
    op.drop_table("users")
    for t in ("approval_action", "approval_node", "change_request_status", "change_type", "user_role"):
        op.execute(f"DROP TYPE IF EXISTS {t}")
