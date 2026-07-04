import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.types import JSONType, UUIDType

from src.core.database import Base


class ExperimentStatus(str, enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


# 合法状态流转映射
STATUS_TRANSITIONS: dict[ExperimentStatus, set[ExperimentStatus]] = {
    ExperimentStatus.DRAFT: {ExperimentStatus.PLANNED, ExperimentStatus.CANCELLED},
    ExperimentStatus.PLANNED: {ExperimentStatus.IN_PROGRESS, ExperimentStatus.CANCELLED},
    ExperimentStatus.IN_PROGRESS: {
        ExperimentStatus.PAUSED,
        ExperimentStatus.COMPLETED,
        ExperimentStatus.FAILED,
    },
    ExperimentStatus.PAUSED: {ExperimentStatus.IN_PROGRESS},
    ExperimentStatus.COMPLETED: {ExperimentStatus.ARCHIVED},
    ExperimentStatus.FAILED: {ExperimentStatus.ARCHIVED},
    ExperimentStatus.CANCELLED: set(),
    ExperimentStatus.ARCHIVED: set(),
}


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    hypothesis: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ExperimentStatus] = mapped_column(
        Enum(ExperimentStatus, name="experiment_status"),
        default=ExperimentStatus.DRAFT,
        nullable=False,
        index=True,
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, index=True)
    protocol_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, index=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONType, default=dict)
    planned_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
