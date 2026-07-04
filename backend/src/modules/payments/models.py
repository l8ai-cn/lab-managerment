import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.types import JSONType, UUIDType

from src.core.database import Base
from src.modules.users.models import User  # noqa: F401


class FeeType(str, enum.Enum):
    LAB_USAGE = "lab_usage"
    CONSUMABLE = "consumable"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"), index=True)
    ref_type: Mapped[str] = mapped_column(String(50), nullable=False)
    ref_id: Mapped[uuid.UUID] = mapped_column(UUIDType, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    fee_type: Mapped[FeeType] = mapped_column(Enum(FeeType, name="fee_type"), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING, index=True
    )
    bank_ref: Mapped[str | None] = mapped_column(String(100))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
