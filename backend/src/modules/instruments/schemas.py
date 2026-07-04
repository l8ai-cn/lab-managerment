import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.instruments.models import BookingStatus, InstrumentStatus, ReviewStatus


class InstrumentBase(BaseModel):
    name: str = Field(..., max_length=200)
    model: str | None = None
    manufacturer: str | None = None
    serial_no: str | None = None
    asset_no: str | None = None
    category: str | None = None
    purchase_date: datetime | None = None
    purchase_price: float | None = None
    lab_id: uuid.UUID | None = None
    location: str | None = None
    manager_id: uuid.UUID | None = None
    metadata: dict | None = None


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentUpdate(BaseModel):
    name: str | None = None
    model: str | None = None
    manufacturer: str | None = None
    serial_no: str | None = None
    asset_no: str | None = None
    category: str | None = None
    purchase_date: datetime | None = None
    purchase_price: float | None = None
    lab_id: uuid.UUID | None = None
    location: str | None = None
    manager_id: uuid.UUID | None = None
    status: InstrumentStatus | None = None
    metadata: dict | None = None


class StatusChangeRequest(BaseModel):
    status: InstrumentStatus
    reason: str | None = None


class InstrumentResponse(InstrumentBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    code: str
    status: InstrumentStatus
    metadata: dict | None = Field(None, validation_alias="metadata_")
    lab_name: str | None = None
    created_at: datetime
    updated_at: datetime


class InstrumentListResponse(BaseModel):
    items: list[InstrumentResponse]
    total: int
    page: int
    page_size: int


class BookingRuleBase(BaseModel):
    open_hours: dict = {}
    min_duration_minutes: int = 30
    max_duration_minutes: int = 480
    daily_limit: int | None = None
    weekly_limit: int | None = None
    advance_hours: int = 24
    approval_mode: str = "manager"
    internal_rules: dict | None = None
    external_rules: dict | None = None
    is_active: bool = True


class BookingRuleCreate(BookingRuleBase):
    instrument_id: uuid.UUID


class BookingRuleResponse(BookingRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    instrument_id: uuid.UUID


class InstrumentBookingCreate(BaseModel):
    instrument_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    purpose: str
    project_name: str | None = None


class InstrumentBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    instrument_id: uuid.UUID
    instrument_name: str | None = None
    user_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    purpose: str
    project_name: str | None
    status: BookingStatus
    created_at: datetime


class BookingListResponse(BaseModel):
    items: list[InstrumentBookingResponse]
    total: int
    page: int
    page_size: int


class ApprovalRequest(BaseModel):
    comment: str | None = None


class UsageRecordCreate(BaseModel):
    content: str | None = None
    parameters: dict | None = None
    consumables: dict | None = None
    status_feedback: str | None = None
    attachments: list | None = None


class UsageRecordResponse(UsageRecordCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    review_status: ReviewStatus
    reviewer_comment: str | None
    created_at: datetime


class PendingInstrumentUsageItem(BaseModel):
    booking_id: uuid.UUID
    instrument_id: uuid.UUID
    instrument_name: str | None = None
    content: str | None = None
    review_status: ReviewStatus
    created_at: datetime


class PendingInstrumentUsageListResponse(BaseModel):
    items: list[PendingInstrumentUsageItem]
    total: int


class BatchUsageReviewRequest(BaseModel):
    booking_ids: list[uuid.UUID] = Field(..., min_length=1)
    approve: bool = True
    comment: str | None = None


class BatchUsageReviewResponse(BaseModel):
    processed: int
    failed: list[uuid.UUID] = []


class CalendarSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    status: str  # available / booked / in_use
