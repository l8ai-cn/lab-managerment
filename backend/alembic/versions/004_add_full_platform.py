"""Add full platform tables: instruments, lab bookings, projects, faults, reporting, integrations, payments, notifications."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), server_default="system"),
        sa.Column("is_read", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # --- instruments ---
    instrument_status = postgresql.ENUM(
        "normal", "maintenance", "disabled", "scrapped", name="instrument_status", create_type=False
    )
    booking_status = postgresql.ENUM(
        "pending", "approved", "rejected", "cancelled", "completed", "in_use",
        name="booking_status", create_type=False,
    )
    review_status = postgresql.ENUM("pending", "approved", "rejected", name="review_status", create_type=False)

    for enum_type in (instrument_status, booking_status, review_status):
        enum_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "instruments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("model", sa.String(100)),
        sa.Column("manufacturer", sa.String(200)),
        sa.Column("serial_no", sa.String(100)),
        sa.Column("asset_no", sa.String(50)),
        sa.Column("category", sa.String(100)),
        sa.Column("purchase_date", sa.DateTime(timezone=True)),
        sa.Column("purchase_price", sa.Numeric(14, 2)),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id")),
        sa.Column("location", sa.String(200)),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True)),
        sa.Column("status", instrument_status, nullable=False, server_default="normal"),
        sa.Column("synced_from_asset", sa.Boolean(), server_default="false"),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_instruments_code", "instruments", ["code"], unique=True)
    op.create_index("ix_instruments_lab_id", "instruments", ["lab_id"])
    op.create_index("ix_instruments_status", "instruments", ["status"])

    op.create_table(
        "instrument_status_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("instrument_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("instruments.id"), nullable=False),
        sa.Column("old_status", instrument_status),
        sa.Column("new_status", instrument_status, nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_instrument_status_logs_instrument_id", "instrument_status_logs", ["instrument_id"])

    op.create_table(
        "instrument_booking_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("instrument_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("instruments.id"), nullable=False),
        sa.Column("open_hours", postgresql.JSONB(), server_default="{}"),
        sa.Column("min_duration_minutes", sa.Integer(), server_default="30"),
        sa.Column("max_duration_minutes", sa.Integer(), server_default="480"),
        sa.Column("daily_limit", sa.Integer()),
        sa.Column("weekly_limit", sa.Integer()),
        sa.Column("advance_hours", sa.Integer(), server_default="24"),
        sa.Column("approval_mode", sa.String(20), server_default="manager"),
        sa.Column("internal_rules", postgresql.JSONB(), server_default="{}"),
        sa.Column("external_rules", postgresql.JSONB(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_instrument_booking_rules_instrument_id", "instrument_booking_rules", ["instrument_id"], unique=True)

    op.create_table(
        "instrument_bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("instrument_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("instruments.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("project_name", sa.String(200)),
        sa.Column("status", booking_status, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_instrument_bookings_instrument_id", "instrument_bookings", ["instrument_id"])
    op.create_index("ix_instrument_bookings_user_id", "instrument_bookings", ["user_id"])
    op.create_index("ix_instrument_bookings_status", "instrument_bookings", ["status"])

    op.create_table(
        "instrument_booking_approvals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("instrument_bookings.id"), nullable=False),
        sa.Column("approver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(20)),
        sa.Column("comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_instrument_booking_approvals_booking_id", "instrument_booking_approvals", ["booking_id"])

    op.create_table(
        "instrument_usage_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("instrument_bookings.id"), unique=True),
        sa.Column("content", sa.Text()),
        sa.Column("parameters", postgresql.JSONB(), server_default="{}"),
        sa.Column("consumables", postgresql.JSONB(), server_default="{}"),
        sa.Column("status_feedback", sa.Text()),
        sa.Column("attachments", postgresql.JSONB(), server_default="[]"),
        sa.Column("review_status", review_status, server_default="pending"),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True)),
        sa.Column("reviewer_comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- lab bookings ---
    lab_usage_type = postgresql.ENUM(
        "teaching", "research", "open", "competition", "service", name="lab_usage_type", create_type=False
    )
    lab_booking_status = postgresql.ENUM(
        "pending", "approved", "rejected", "cancelled", "completed",
        name="lab_booking_status", create_type=False,
    )
    check_in_method = postgresql.ENUM("card", "qr", "face", name="check_in_method", create_type=False)
    access_method = postgresql.ENUM("qr", "face", "password", name="access_method", create_type=False)
    lab_usage_review_status = postgresql.ENUM(
        "pending", "approved", "rejected", name="lab_usage_review_status", create_type=False
    )

    for enum_type in (lab_usage_type, lab_booking_status, check_in_method, access_method, lab_usage_review_status):
        enum_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "lab_booking_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id"), nullable=False),
        sa.Column("open_hours", postgresql.JSONB(), server_default="{}"),
        sa.Column("allowed_roles", postgresql.JSONB(), server_default="[]"),
        sa.Column("daily_limit", sa.Integer()),
        sa.Column("usage_type_rules", postgresql.JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_booking_rules_lab_id", "lab_booking_rules", ["lab_id"], unique=True)

    op.create_table(
        "lab_bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("usage_type", lab_usage_type, nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("expected_count", sa.Integer()),
        sa.Column("status", lab_booking_status, server_default="pending"),
        sa.Column("is_recurring", sa.Boolean(), server_default="false"),
        sa.Column("recurrence_rule", postgresql.JSONB(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_bookings_lab_id", "lab_bookings", ["lab_id"])
    op.create_index("ix_lab_bookings_user_id", "lab_bookings", ["user_id"])
    op.create_index("ix_lab_bookings_status", "lab_bookings", ["status"])

    op.create_table(
        "lab_booking_approvals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_bookings.id"), nullable=False),
        sa.Column("approver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(20)),
        sa.Column("comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_booking_approvals_booking_id", "lab_booking_approvals", ["booking_id"])

    op.create_table(
        "lab_check_ins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_bookings.id"), nullable=False),
        sa.Column("method", check_in_method, nullable=False),
        sa.Column("actual_count", sa.Integer()),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_check_ins_booking_id", "lab_check_ins", ["booking_id"])

    op.create_table(
        "lab_access_grants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_bookings.id"), nullable=False),
        sa.Column("access_method", access_method, nullable=False),
        sa.Column("access_token", sa.String(200), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lab_access_grants_booking_id", "lab_access_grants", ["booking_id"])
    op.create_index("ix_lab_access_grants_access_token", "lab_access_grants", ["access_token"])

    op.create_table(
        "lab_usage_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lab_bookings.id"), unique=True),
        sa.Column("content", sa.Text()),
        sa.Column("parameters", postgresql.JSONB(), server_default="{}"),
        sa.Column("consumables", postgresql.JSONB(), server_default="{}"),
        sa.Column("attachments", postgresql.JSONB(), server_default="[]"),
        sa.Column("review_status", lab_usage_review_status, server_default="pending"),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True)),
        sa.Column("reviewer_comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- experiment projects ---
    project_type = postgresql.ENUM(
        "verification", "comprehensive", "design", "innovation", name="project_type", create_type=False
    )
    project_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("department", sa.String(200)),
        sa.Column("major", sa.String(200)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_courses_code", "courses", ["code"], unique=True)

    op.create_table(
        "experiment_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("type", project_type, nullable=False),
        sa.Column("hours", sa.Integer()),
        sa.Column("instruments_needed", postgresql.JSONB(), server_default="[]"),
        sa.Column("consumables", postgresql.JSONB(), server_default="[]"),
        sa.Column("majors", postgresql.JSONB(), server_default="[]"),
        sa.Column("semester", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_experiment_projects_course_id", "experiment_projects", ["course_id"])
    op.create_index("ix_experiment_projects_semester", "experiment_projects", ["semester"])

    # --- faults ---
    fault_status = postgresql.ENUM(
        "pending", "assigned", "processing", "resolved", "closed", name="fault_status", create_type=False
    )
    fault_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "fault_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lab_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("labs.id"), nullable=False),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("fault_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", fault_status, server_default="pending"),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("attachments", postgresql.JSONB(), server_default="[]"),
        sa.Column("qr_code_token", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_fault_reports_lab_id", "fault_reports", ["lab_id"])
    op.create_index("ix_fault_reports_reporter_id", "fault_reports", ["reporter_id"])
    op.create_index("ix_fault_reports_status", "fault_reports", ["status"])
    op.create_index("ix_fault_reports_fault_type", "fault_reports", ["fault_type"])

    op.create_table(
        "fault_handling_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("fault_reports.id"), nullable=False),
        sa.Column("handler_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("comment", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_fault_handling_records_report_id", "fault_handling_records", ["report_id"])

    # --- data reporting ---
    report_submission_status = postgresql.ENUM(
        "draft", "submitted", "approved", name="report_submission_status", create_type=False
    )
    report_submission_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "data_report_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("schema", postgresql.JSONB(), server_default="{}"),
        sa.Column("description", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_data_report_templates_code", "data_report_templates", ["code"], unique=True)

    op.create_table(
        "data_report_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("data_report_templates.id"), nullable=False),
        sa.Column("unit_name", sa.String(200), nullable=False),
        sa.Column("period", sa.String(50), nullable=False),
        sa.Column("data", postgresql.JSONB(), server_default="{}"),
        sa.Column("status", report_submission_status, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_data_report_submissions_template_id", "data_report_submissions", ["template_id"])
    op.create_index("ix_data_report_submissions_period", "data_report_submissions", ["period"])
    op.create_index("ix_data_report_submissions_status", "data_report_submissions", ["status"])

    # --- integrations ---
    integration_type = postgresql.ENUM(
        "asset", "card", "access", "face", "payment", name="integration_type", create_type=False
    )
    sync_status = postgresql.ENUM("success", "failed", "partial", name="sync_status", create_type=False)
    for enum_type in (integration_type, sync_status):
        enum_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "integration_sync_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("integration_type", integration_type, nullable=False),
        sa.Column("status", sync_status, nullable=False),
        sa.Column("synced_count", sa.Integer(), server_default="0"),
        sa.Column("message", sa.Text()),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_integration_sync_logs_integration_type", "integration_sync_logs", ["integration_type"])

    # --- payments ---
    fee_type = postgresql.ENUM("lab_usage", "consumable", name="fee_type", create_type=False)
    payment_status = postgresql.ENUM(
        "pending", "paid", "failed", "refunded", name="payment_status", create_type=False
    )
    for enum_type in (fee_type, payment_status):
        enum_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "payment_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("ref_type", sa.String(50), nullable=False),
        sa.Column("ref_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("fee_type", fee_type, nullable=False),
        sa.Column("status", payment_status, server_default="pending"),
        sa.Column("bank_ref", sa.String(100)),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_payment_orders_user_id", "payment_orders", ["user_id"])
    op.create_index("ix_payment_orders_ref_id", "payment_orders", ["ref_id"])
    op.create_index("ix_payment_orders_status", "payment_orders", ["status"])


def downgrade() -> None:
    op.drop_table("payment_orders")
    op.drop_table("integration_sync_logs")
    op.drop_table("data_report_submissions")
    op.drop_table("data_report_templates")
    op.drop_table("fault_handling_records")
    op.drop_table("fault_reports")
    op.drop_table("experiment_projects")
    op.drop_table("courses")
    op.drop_table("lab_usage_records")
    op.drop_table("lab_access_grants")
    op.drop_table("lab_check_ins")
    op.drop_table("lab_booking_approvals")
    op.drop_table("lab_bookings")
    op.drop_table("lab_booking_rules")
    op.drop_table("instrument_usage_records")
    op.drop_table("instrument_booking_approvals")
    op.drop_table("instrument_bookings")
    op.drop_table("instrument_booking_rules")
    op.drop_table("instrument_status_logs")
    op.drop_table("instruments")
    op.drop_table("notifications")

    for t in (
        "payment_status", "fee_type", "sync_status", "integration_type",
        "report_submission_status", "fault_status", "project_type",
        "lab_usage_review_status", "access_method", "check_in_method",
        "lab_booking_status", "lab_usage_type", "review_status", "booking_status", "instrument_status",
    ):
        op.execute(f"DROP TYPE IF EXISTS {t}")
