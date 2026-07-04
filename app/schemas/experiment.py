"""实验相关的 Pydantic Schema。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ExperimentPriority, ExperimentStatus, RecordType


class ExperimentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="实验名称")
    description: str | None = Field(default=None, description="实验描述 / 目的")
    priority: ExperimentPriority = Field(
        default=ExperimentPriority.MEDIUM, description="优先级"
    )
    owner: str | None = Field(default=None, max_length=128, description="负责人")
    lab_location: str | None = Field(
        default=None, max_length=255, description="实验地点"
    )
    tags: str | None = Field(
        default=None, max_length=512, description="标签,建议以逗号分隔"
    )
    planned_start_at: datetime | None = Field(
        default=None, description="计划开始时间"
    )
    planned_end_at: datetime | None = Field(
        default=None, description="计划结束时间"
    )

    @model_validator(mode="after")
    def _validate_planned_window(self) -> "ExperimentBase":
        if (
            self.planned_start_at is not None
            and self.planned_end_at is not None
            and self.planned_end_at < self.planned_start_at
        ):
            raise ValueError("计划结束时间不能早于计划开始时间")
        return self


class ExperimentCreate(ExperimentBase):
    code: str | None = Field(
        default=None,
        max_length=64,
        description="实验编号,不填则自动生成",
    )


class ExperimentUpdate(BaseModel):
    """部分更新;所有字段可选。"""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: ExperimentPriority | None = None
    owner: str | None = Field(default=None, max_length=128)
    lab_location: str | None = Field(default=None, max_length=255)
    tags: str | None = Field(default=None, max_length=512)
    planned_start_at: datetime | None = None
    planned_end_at: datetime | None = None


class ExperimentStatusUpdate(BaseModel):
    """状态流转请求。"""

    status: ExperimentStatus = Field(..., description="目标状态")


class ExperimentRecordCreate(BaseModel):
    record_type: RecordType = Field(
        default=RecordType.NOTE, description="记录类型"
    )
    content: str = Field(..., min_length=1, description="记录内容")
    recorded_by: str | None = Field(
        default=None, max_length=128, description="记录人"
    )


class ExperimentRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    experiment_id: int
    record_type: RecordType
    content: str
    recorded_by: str | None
    recorded_at: datetime


class ExperimentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    description: str | None
    status: ExperimentStatus
    priority: ExperimentPriority
    owner: str | None
    lab_location: str | None
    tags: str | None
    planned_start_at: datetime | None
    planned_end_at: datetime | None
    actual_start_at: datetime | None
    actual_end_at: datetime | None
    created_at: datetime
    updated_at: datetime
    records: list[ExperimentRecordRead] = Field(default_factory=list)
