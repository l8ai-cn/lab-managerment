import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.faults.models import FaultStatus


class FaultReportCreate(BaseModel):
    lab_id: uuid.UUID
    fault_type: str = Field(..., max_length=100)
    description: str
    attachments: list | None = None


class FaultReportUpdate(BaseModel):
    fault_type: str | None = Field(None, max_length=100)
    description: str | None = None
    attachments: list | None = None


class FaultReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lab_id: uuid.UUID
    lab_name: str | None = None
    reporter_id: uuid.UUID
    fault_type: str
    description: str
    status: FaultStatus
    assignee_id: uuid.UUID | None
    attachments: list | None
    qr_code_token: str | None
    created_at: datetime
    updated_at: datetime


class FaultReportListResponse(BaseModel):
    items: list[FaultReportResponse]
    total: int
    page: int
    page_size: int


class AssignRequest(BaseModel):
    assignee_id: uuid.UUID


class StatusUpdateRequest(BaseModel):
    status: FaultStatus


class HandleRequest(BaseModel):
    action: str = Field(..., max_length=50)
    comment: str | None = None


class HandlingRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_id: uuid.UUID
    handler_id: uuid.UUID
    action: str
    comment: str | None
    created_at: datetime


class FaultStatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_type: dict[str, int]
    by_lab: dict[str, int]


class FaultQrResponse(BaseModel):
    lab_id: uuid.UUID
    qr_token: str
    url: str
