import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.lab_bookings.models import (
    AccessMethod,
    CheckInMethod,
    LabBookingStatus,
    UsageReviewStatus,
    UsageType,
)


class BookingRuleBase(BaseModel):
    open_hours: dict = {}
    allowed_roles: list[str] | None = None
    daily_limit: int | None = None
    usage_type_rules: dict | None = None


class BookingRuleCreate(BookingRuleBase):
    lab_id: uuid.UUID


class BookingRuleUpdate(BaseModel):
    open_hours: dict | None = None
    allowed_roles: list[str] | None = None
    daily_limit: int | None = None
    usage_type_rules: dict | None = None


class BookingRuleResponse(BookingRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lab_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class LabBookingCreate(BaseModel):
    lab_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    usage_type: UsageType
    purpose: str
    expected_count: int | None = Field(None, ge=1)
    is_recurring: bool = False
    recurrence_rule: dict | None = None


class LabBookingUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    usage_type: UsageType | None = None
    purpose: str | None = None
    expected_count: int | None = Field(None, ge=1)
    is_recurring: bool | None = None
    recurrence_rule: dict | None = None


class LabBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lab_id: uuid.UUID
    lab_name: str | None = None
    user_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    usage_type: UsageType
    purpose: str
    expected_count: int | None
    status: LabBookingStatus
    is_recurring: bool
    recurrence_rule: dict | None
    created_at: datetime
    updated_at: datetime


class LabBookingListResponse(BaseModel):
    items: list[LabBookingResponse]
    total: int
    page: int
    page_size: int


class ApprovalRequest(BaseModel):
    comment: str | None = None


class CheckInCreate(BaseModel):
    method: CheckInMethod
    actual_count: int | None = Field(None, ge=0)


class CheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    method: CheckInMethod
    actual_count: int | None
    checked_in_at: datetime


class AccessGrantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    access_method: AccessMethod
    access_token: str
    expires_at: datetime
    created_at: datetime


class UsageRecordCreate(BaseModel):
    content: str | None = None
    parameters: dict | None = None
    consumables: dict | None = None
    attachments: list | None = None


class UsageRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    content: str | None
    parameters: dict | None
    consumables: dict | None
    attachments: list | None
    review_status: UsageReviewStatus
    reviewer_comment: str | None
    created_at: datetime
    updated_at: datetime


class CalendarSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    status: str
    usage_type: str | None = None
