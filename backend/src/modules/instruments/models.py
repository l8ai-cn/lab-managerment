import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.modules.labs.models import Lab  # noqa: F401


class InstrumentStatus(str, enum.Enum):
    NORMAL = "normal"
    MAINTENANCE = "maintenance"
    DISABLED = "disabled"
    SCRAPPED = "scrapped"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    IN_USE = "in_use"


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Instrument(Base):
    __tablename__ = "instruments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    model: Mapped[str | None] = mapped_column(String(100))
    manufacturer: Mapped[str | None] = mapped_column(String(200))
    serial_no: Mapped[str | None] = mapped_column(String(100))
    asset_no: Mapped[str | None] = mapped_column(String(50), index=True)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    purchase_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    purchase_price: Mapped[float | None] = mapped_column(Numeric(14, 2))
    lab_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("labs.id"), index=True)
    location: Mapped[str | None] = mapped_column(String(200))
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    status: Mapped[InstrumentStatus] = mapped_column(
        Enum(InstrumentStatus, name="instrument_status"),
        default=InstrumentStatus.NORMAL,
        nullable=False,
        index=True,
    )
    synced_from_asset: Mapped[bool] = mapped_column(default=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    lab = relationship("Lab", lazy="selectin")


class InstrumentStatusLog(Base):
    __tablename__ = "instrument_status_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrument_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("instruments.id"), index=True)
    old_status: Mapped[InstrumentStatus | None] = mapped_column(Enum(InstrumentStatus, name="instrument_status", create_constraint=False))
    new_status: Mapped[InstrumentStatus] = mapped_column(Enum(InstrumentStatus, name="instrument_status", create_constraint=False), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class InstrumentBookingRule(Base):
    __tablename__ = "instrument_booking_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrument_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("instruments.id"), unique=True, index=True)
    open_hours: Mapped[dict] = mapped_column(JSONB, default=dict)  # {mon:[{start,end}],...}
    min_duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    max_duration_minutes: Mapped[int] = mapped_column(Integer, default=480)
    daily_limit: Mapped[int | None] = mapped_column(Integer)
    weekly_limit: Mapped[int | None] = mapped_column(Integer)
    advance_hours: Mapped[int] = mapped_column(Integer, default=24)
    approval_mode: Mapped[str] = mapped_column(String(20), default="manager")  # manager / multi
    internal_rules: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    external_rules: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class InstrumentBooking(Base):
    __tablename__ = "instrument_bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrument_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("instruments.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    project_name: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus, name="booking_status"), default=BookingStatus.PENDING, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    instrument = relationship("Instrument", lazy="selectin")
    approvals: Mapped[list["InstrumentBookingApproval"]] = relationship(back_populates="booking", lazy="selectin")
    usage_record: Mapped["InstrumentUsageRecord | None"] = relationship(back_populates="booking", uselist=False, lazy="selectin")


class InstrumentBookingApproval(Base):
    __tablename__ = "instrument_booking_approvals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("instrument_bookings.id"), index=True)
    approver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(20))  # approve / reject
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    booking: Mapped["InstrumentBooking"] = relationship(back_populates="approvals")


class InstrumentUsageRecord(Base):
    __tablename__ = "instrument_usage_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("instrument_bookings.id"), unique=True)
    content: Mapped[str | None] = mapped_column(Text)
    parameters: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    consumables: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    status_feedback: Mapped[str | None] = mapped_column(Text)
    attachments: Mapped[list | None] = mapped_column(JSONB, default=list)
    review_status: Mapped[ReviewStatus] = mapped_column(Enum(ReviewStatus, name="review_status"), default=ReviewStatus.PENDING)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewer_comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    booking: Mapped["InstrumentBooking"] = relationship(back_populates="usage_record")
