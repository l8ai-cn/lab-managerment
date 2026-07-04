import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.types import JSONType, UUIDType

from src.core.database import Base
from src.modules.labs.models import Lab  # noqa: F401
from src.modules.users.models import User  # noqa: F401


class FaultStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class FaultReport(Base):
    __tablename__ = "fault_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("labs.id"), index=True)
    reporter_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"), index=True)
    fault_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[FaultStatus] = mapped_column(
        Enum(FaultStatus, name="fault_status"), default=FaultStatus.PENDING, index=True
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, ForeignKey("users.id"), index=True)
    attachments: Mapped[list | None] = mapped_column(JSONType, default=list)
    qr_code_token: Mapped[str | None] = mapped_column(String(100), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    lab = relationship("Lab", lazy="selectin")
    handling_records: Mapped[list["FaultHandlingRecord"]] = relationship(
        back_populates="report", lazy="selectin"
    )


class FaultHandlingRecord(Base):
    __tablename__ = "fault_handling_records"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("fault_reports.id"), index=True)
    handler_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    report: Mapped["FaultReport"] = relationship(back_populates="handling_records")
