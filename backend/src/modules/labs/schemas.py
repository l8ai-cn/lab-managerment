import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.labs.models import InspectionStatus, LabType, OpenStatus


class LabBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    room_id: uuid.UUID | None = None
    location_detail: str | None = Field(None, max_length=300)
    area_sqm: float | None = Field(None, ge=0)
    functional_zones: list[str] | None = None
    capacity: int | None = Field(None, ge=0)
    lab_type: LabType | None = None
    manager_id: uuid.UUID | None = None
    open_status: OpenStatus = OpenStatus.OPEN
    inspection_status: InspectionStatus = InspectionStatus.NORMAL
    description: str | None = Field(None, max_length=5000)
    metadata: dict | None = None


class LabCreate(LabBase):
    pass


class LabUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    room_id: uuid.UUID | None = None
    location_detail: str | None = None
    area_sqm: float | None = Field(None, ge=0)
    functional_zones: list[str] | None = None
    capacity: int | None = Field(None, ge=0)
    lab_type: LabType | None = None
    manager_id: uuid.UUID | None = None
    open_status: OpenStatus | None = None
    inspection_status: InspectionStatus | None = None
    description: str | None = None
    metadata: dict | None = None


class LabResponse(LabBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    code: str
    metadata: dict | None = Field(None, validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime
    building_name: str | None = None
    floor_name: str | None = None
    room_name: str | None = None


class LabListResponse(BaseModel):
    items: list[LabResponse]
    total: int
    page: int
    page_size: int


class LabImportRow(BaseModel):
    code: str | None = None
    name: str
    building_name: str
    floor_number: int
    room_code: str | None = None
    location_detail: str | None = None
    area_sqm: float | None = None
    capacity: int | None = None
    lab_type: LabType | None = None
    open_status: OpenStatus | None = None
    description: str | None = None


class LabImportResult(BaseModel):
    success_count: int
    error_count: int
    errors: list[str] = []
