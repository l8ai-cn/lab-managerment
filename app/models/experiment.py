"""实验及实验记录的 ORM 模型。"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ExperimentPriority, ExperimentStatus, RecordType


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Experiment(Base):
    """实验主体。"""

    __tablename__ = "experiments"
    __table_args__ = (
        Index("ix_experiments_status", "status"),
        Index("ix_experiments_owner", "owner"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, default=None)

    status: Mapped[ExperimentStatus] = mapped_column(
        SAEnum(ExperimentStatus, native_enum=False, length=32),
        default=ExperimentStatus.DRAFT,
    )
    priority: Mapped[ExperimentPriority] = mapped_column(
        SAEnum(ExperimentPriority, native_enum=False, length=16),
        default=ExperimentPriority.MEDIUM,
    )

    owner: Mapped[str | None] = mapped_column(String(128), default=None)
    lab_location: Mapped[str | None] = mapped_column(String(255), default=None)
    tags: Mapped[str | None] = mapped_column(String(512), default=None)

    planned_start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    planned_end_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    actual_start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    actual_end_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )

    records: Mapped[list["ExperimentRecord"]] = relationship(
        back_populates="experiment",
        cascade="all, delete-orphan",
        order_by="ExperimentRecord.recorded_at",
    )


class ExperimentRecord(Base):
    """实验过程记录 / 日志。"""

    __tablename__ = "experiment_records"
    __table_args__ = (
        Index("ix_experiment_records_experiment_id", "experiment_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("experiments.id", ondelete="CASCADE")
    )
    record_type: Mapped[RecordType] = mapped_column(
        SAEnum(RecordType, native_enum=False, length=32),
        default=RecordType.NOTE,
    )
    content: Mapped[str] = mapped_column(Text)
    recorded_by: Mapped[str | None] = mapped_column(String(128), default=None)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now()
    )

    experiment: Mapped["Experiment"] = relationship(back_populates="records")
