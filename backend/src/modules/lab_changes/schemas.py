import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.lab_changes.models import (
    ApprovalAction,
    ApprovalNode,
    ChangeRequestStatus,
    ChangeType,
)


class ChangeRequestBase(BaseModel):
    lab_id: uuid.UUID
    change_type: ChangeType
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(None, max_length=5000)
    change_content: dict = {}


class ChangeRequestCreate(ChangeRequestBase):
    pass


class ChangeRequestUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    change_content: dict | None = None


class ApprovalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    approver_id: uuid.UUID
    approver_name: str | None = None
    node: ApprovalNode
    action: ApprovalAction
    comment: str | None
    created_at: datetime


class ChangeRequestResponse(ChangeRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    applicant_id: uuid.UUID
    applicant_name: str | None = None
    status: ChangeRequestStatus
    lab_name: str | None = None
    lab_code: str | None = None
    approval_records: list[ApprovalRecordResponse] = []
    created_at: datetime
    updated_at: datetime


class ChangeRequestListResponse(BaseModel):
    items: list[ChangeRequestResponse]
    total: int
    page: int
    page_size: int


class ApprovalActionRequest(BaseModel):
    comment: str | None = Field(None, max_length=2000)
