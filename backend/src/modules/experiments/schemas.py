import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.experiments.models import ExperimentStatus


class ExperimentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=5000)
    hypothesis: str | None = Field(None, max_length=2000)
    owner_id: uuid.UUID | None = None
    protocol_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    metadata: dict | None = None
    planned_start: datetime | None = None
    planned_end: datetime | None = None


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=5000)
    hypothesis: str | None = Field(None, max_length=2000)
    owner_id: uuid.UUID | None = None
    protocol_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    metadata: dict | None = None
    planned_start: datetime | None = None
    planned_end: datetime | None = None


class ExperimentResponse(ExperimentBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    code: str
    status: ExperimentStatus
    metadata: dict | None = Field(None, validation_alias="metadata_")
    actual_start: datetime | None
    actual_end: datetime | None
    created_at: datetime
    updated_at: datetime


class ExperimentListResponse(BaseModel):
    items: list[ExperimentResponse]
    total: int
    page: int
    page_size: int


class StatusTransitionRequest(BaseModel):
    reason: str | None = Field(None, max_length=1000)


class StatusTransitionResponse(BaseModel):
    id: uuid.UUID
    status: ExperimentStatus
    message: str
