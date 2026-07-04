import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.types import JSONType, UUIDType

from src.core.database import Base
from src.modules.spaces.models import Room  # noqa: F401 — register mapper for relationships


class LabType(str, enum.Enum):
    TEACHING = "teaching"
    RESEARCH = "research"
    COMPREHENSIVE = "comprehensive"
    INNOVATION = "innovation"
    TRAINING = "training"


class OpenStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    MAINTENANCE = "maintenance"


class InspectionStatus(str, enum.Enum):
    NORMAL = "normal"
    PENDING = "pending"
    ISSUE = "issue"


class Lab(Base):
    __tablename__ = "labs"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    room_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("rooms.id"), index=True
    )
    location_detail: Mapped[str | None] = mapped_column(String(300))
    area_sqm: Mapped[float | None] = mapped_column(Numeric(10, 2))
    functional_zones: Mapped[list | None] = mapped_column(JSONType, default=list)
    capacity: Mapped[int | None] = mapped_column(Integer)
    lab_type: Mapped[LabType | None] = mapped_column(Enum(LabType, name="lab_type"))
    manager_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, index=True)
    open_status: Mapped[OpenStatus] = mapped_column(
        Enum(OpenStatus, name="open_status"),
        default=OpenStatus.OPEN,
        nullable=False,
        index=True,
    )
    inspection_status: Mapped[InspectionStatus] = mapped_column(
        Enum(InspectionStatus, name="inspection_status"),
        default=InspectionStatus.NORMAL,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    room = relationship("Room", lazy="selectin", foreign_keys=[room_id])
