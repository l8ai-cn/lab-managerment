import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.payments.models import FeeType, PaymentStatus


class PaymentOrderCreate(BaseModel):
    ref_type: str = Field(..., max_length=50)
    ref_id: uuid.UUID
    amount: float = Field(..., gt=0)
    fee_type: FeeType


class PaymentOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    ref_type: str
    ref_id: uuid.UUID
    amount: float
    fee_type: FeeType
    status: PaymentStatus
    bank_ref: str | None
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PaymentOrderListResponse(BaseModel):
    items: list[PaymentOrderResponse]
    total: int
    page: int
    page_size: int


class PayResponse(BaseModel):
    order_id: uuid.UUID
    status: PaymentStatus
    bank_ref: str
    message: str
