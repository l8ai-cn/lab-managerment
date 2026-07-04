import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.types import JSONType, UUIDType

from src.core.database import Base
from src.modules.labs.models import Lab  # noqa: F401
from src.modules.users.models import User  # noqa: F401


class UsageType(str, enum.Enum):
    TEACHING = "teaching"
    RESEARCH = "research"
    OPEN = "open"
    COMPETITION = "competition"
    SERVICE = "service"


class LabBookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class CheckInMethod(str, enum.Enum):
    CARD = "card"
    QR = "qr"
    FACE = "face"


class AccessMethod(str, enum.Enum):
    QR = "qr"
    FACE = "face"
    PASSWORD = "password"


class UsageReviewStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LabBookingRule(Base):
    __tablename__ = "lab_booking_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("labs.id"), unique=True, index=True)
    open_hours: Mapped[dict] = mapped_column(JSONType, default=dict)
    allowed_roles: Mapped[list | None] = mapped_column(JSONType, default=list)
    daily_limit: Mapped[int | None] = mapped_column(Integer)
    usage_type_rules: Mapped[dict | None] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    lab = relationship("Lab", lazy="selectin")


class LabBooking(Base):
    __tablename__ = "lab_bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("labs.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usage_type: Mapped[UsageType] = mapped_column(Enum(UsageType, name="lab_usage_type"), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    expected_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[LabBookingStatus] = mapped_column(
        Enum(LabBookingStatus, name="lab_booking_status"),
        default=LabBookingStatus.PENDING,
        index=True,
    )
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[dict | None] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    lab = relationship("Lab", lazy="selectin")
    approvals: Mapped[list["LabBookingApproval"]] = relationship(back_populates="booking", lazy="selectin")
    check_ins: Mapped[list["LabCheckIn"]] = relationship(back_populates="booking", lazy="selectin")
    access_grants: Mapped[list["LabAccessGrant"]] = relationship(back_populates="booking", lazy="selectin")
    usage_record: Mapped["LabUsageRecord | None"] = relationship(back_populates="booking", uselist=False, lazy="selectin")


class LabBookingApproval(Base):
    __tablename__ = "lab_booking_approvals"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("lab_bookings.id"), index=True)
    approver_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(20))
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    booking: Mapped["LabBooking"] = relationship(back_populates="approvals")


class LabCheckIn(Base):
    __tablename__ = "lab_check_ins"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("lab_bookings.id"), index=True)
    method: Mapped[CheckInMethod] = mapped_column(Enum(CheckInMethod, name="check_in_method"), nullable=False)
    actual_count: Mapped[int | None] = mapped_column(Integer)
    checked_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    booking: Mapped["LabBooking"] = relationship(back_populates="check_ins")


class LabAccessGrant(Base):
    __tablename__ = "lab_access_grants"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("lab_bookings.id"), index=True)
    access_method: Mapped[AccessMethod] = mapped_column(Enum(AccessMethod, name="access_method"), nullable=False)
    access_token: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    booking: Mapped["LabBooking"] = relationship(back_populates="access_grants")


class LabUsageRecord(Base):
    __tablename__ = "lab_usage_records"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("lab_bookings.id"), unique=True)
    content: Mapped[str | None] = mapped_column(Text)
    parameters: Mapped[dict | None] = mapped_column(JSONType, default=dict)
    consumables: Mapped[dict | None] = mapped_column(JSONType, default=dict)
    attachments: Mapped[list | None] = mapped_column(JSONType, default=list)
    review_status: Mapped[UsageReviewStatus] = mapped_column(
        Enum(UsageReviewStatus, name="lab_usage_review_status"),
        default=UsageReviewStatus.PENDING,
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType)
    reviewer_comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    booking: Mapped["LabBooking"] = relationship(back_populates="usage_record")
