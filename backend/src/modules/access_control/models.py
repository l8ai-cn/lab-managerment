import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.types import JSONType, UUIDType

from src.core.database import Base
from src.modules.labs.models import Lab  # noqa: F401


class DoorEventType(str, enum.Enum):
    OPEN = "open"
    DENIED = "denied"
    ERROR = "error"


class AccessControlDevice(Base):
    __tablename__ = "access_control_devices"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    device_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    lab_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, ForeignKey("labs.id"), index=True)
    location: Mapped[str | None] = mapped_column(String(300))
    device_type: Mapped[str] = mapped_column(String(50), default="door")
    is_online: Mapped[bool] = mapped_column(default=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONType, default=dict)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class DoorEvent(Base):
    __tablename__ = "door_events"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("access_control_devices.id"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, index=True)
    event_type: Mapped[DoorEventType] = mapped_column(
        Enum(DoorEventType, name="door_event_type"), nullable=False, index=True
    )
    access_token: Mapped[str | None] = mapped_column(String(200))
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
