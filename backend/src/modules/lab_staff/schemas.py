import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabStaffBase(BaseModel):
    employee_no: str = Field(..., min_length=1, max_length=30)
    name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=20)
    office_location: str | None = Field(None, max_length=200)
    user_id: uuid.UUID | None = None


class LabStaffCreate(LabStaffBase):
    lab_ids: list[uuid.UUID] = []


class LabStaffUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = None
    office_location: str | None = None
    user_id: uuid.UUID | None = None
    lab_ids: list[uuid.UUID] | None = None


class LabBrief(BaseModel):
    id: uuid.UUID
    code: str
    name: str


class LabStaffResponse(LabStaffBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    labs: list[LabBrief] = []
    created_at: datetime
    updated_at: datetime


class LabStaffListResponse(BaseModel):
    items: list[LabStaffResponse]
    total: int
    page: int
    page_size: int
