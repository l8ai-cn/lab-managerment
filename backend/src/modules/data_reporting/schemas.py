import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.data_reporting.models import ReportSubmissionStatus


class TemplateBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    schema_def: dict = Field(default={}, validation_alias="schema", serialization_alias="schema")
    description: str | None = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    code: str | None = Field(None, max_length=50)
    name: str | None = Field(None, max_length=200)
    schema_def: dict | None = Field(None, validation_alias="schema", serialization_alias="schema")
    description: str | None = None


class TemplateResponse(TemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int
    page: int
    page_size: int


class SubmissionCreate(BaseModel):
    template_id: uuid.UUID
    unit_name: str = Field(..., max_length=200)
    period: str = Field(..., max_length=50)
    data: dict = {}


class SubmissionUpdate(BaseModel):
    unit_name: str | None = Field(None, max_length=200)
    period: str | None = Field(None, max_length=50)
    data: dict | None = None


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    template_id: uuid.UUID
    template_name: str | None = None
    unit_name: str
    period: str
    data: dict
    status: ReportSubmissionStatus
    created_at: datetime
    updated_at: datetime


class SubmissionListResponse(BaseModel):
    items: list[SubmissionResponse]
    total: int
    page: int
    page_size: int


class AggregateStatsResponse(BaseModel):
    total_submissions: int
    by_status: dict[str, int]
    by_period: dict[str, int]
    by_template: dict[str, int]
