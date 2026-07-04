import hashlib
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.payments.models import PaymentOrder, PaymentReceipt, PaymentStatus
from src.modules.payments.repository import PaymentRepository
from src.modules.payments.schemas import (
    PayResponse,
    PaymentOrderCreate,
    PaymentOrderListResponse,
    PaymentOrderResponse,
    PaymentReceiptResponse,
)
from src.modules.users.models import User


def deterministic_bank_ref(order_id: uuid.UUID) -> str:
    digest = hashlib.sha256(str(order_id).encode()).hexdigest()[:16].upper()
    return f"BOC{digest}"


def _order_response(o: PaymentOrder) -> PaymentOrderResponse:
    return PaymentOrderResponse(
        id=o.id,
        user_id=o.user_id,
        ref_type=o.ref_type,
        ref_id=o.ref_id,
        amount=float(o.amount),
        fee_type=o.fee_type,
        status=o.status,
        bank_ref=o.bank_ref,
        paid_at=o.paid_at,
        created_at=o.created_at,
        updated_at=o.updated_at,
    )


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentRepository(db)
        self.db = db

    async def create_order(self, data: PaymentOrderCreate, user: User) -> PaymentOrderResponse:
        order = PaymentOrder(user_id=user.id, **data.model_dump())
        created = await self.repo.create_order(order)
        await self.db.commit()
        return _order_response(created)

    async def pay_order(self, order_id: uuid.UUID, user: User) -> PayResponse:
        order = await self.repo.get_order(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
        if order.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作")
        if order.status != PaymentStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="订单状态不可支付")
        bank_ref = deterministic_bank_ref(order_id)
        order.status = PaymentStatus.PAID
        order.bank_ref = bank_ref
        order.paid_at = datetime.now(UTC)
        receipt_data = {
            "bank_ref": bank_ref,
            "amount": float(order.amount),
            "order_id": str(order_id),
            "fee_type": order.fee_type.value,
            "ref_type": order.ref_type,
            "ref_id": str(order.ref_id),
            "paid_at": order.paid_at.isoformat(),
            "bank_name": "中国银行",
            "message": "实名支付成功",
        }
        existing = await self.db.execute(select(PaymentReceipt).where(PaymentReceipt.order_id == order_id))
        receipt = existing.scalar_one_or_none()
        if receipt:
            receipt.receipt_data = receipt_data
        else:
            self.db.add(PaymentReceipt(order_id=order_id, receipt_data=receipt_data))
        await self.db.commit()
        return PayResponse(
            order_id=order_id,
            status=PaymentStatus.PAID,
            bank_ref=bank_ref,
            message="中国银行支付成功",
        )

    async def get_receipt(self, order_id: uuid.UUID, user: User) -> PaymentReceiptResponse:
        order = await self.repo.get_order(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
        if order.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
        result = await self.db.execute(select(PaymentReceipt).where(PaymentReceipt.order_id == order_id))
        receipt = result.scalar_one_or_none()
        if not receipt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="支付凭证不存在")
        return PaymentReceiptResponse(
            order_id=order_id,
            receipt_data=receipt.receipt_data,
            created_at=receipt.created_at,
        )

    async def list_orders(self, **kwargs) -> PaymentOrderListResponse:
        items, total = await self.repo.list_orders(**kwargs)
        return PaymentOrderListResponse(
            items=[_order_response(o) for o in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )

    async def pay_for_lab_booking(self, booking_id: uuid.UUID, user: User, amount: float = 50.0) -> PayResponse:
        from src.modules.lab_bookings.models import LabBooking, LabBookingStatus

        result = await self.db.execute(select(LabBooking).where(LabBooking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        if booking.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作")
        if booking.status not in (LabBookingStatus.APPROVED, LabBookingStatus.COMPLETED):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="预约状态不可支付")

        existing = await self.db.execute(
            select(PaymentOrder).where(
                PaymentOrder.ref_type == "lab_booking",
                PaymentOrder.ref_id == booking_id,
                PaymentOrder.status == PaymentStatus.PAID,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="该预约已支付")

        pending = await self.db.execute(
            select(PaymentOrder).where(
                PaymentOrder.ref_type == "lab_booking",
                PaymentOrder.ref_id == booking_id,
                PaymentOrder.status == PaymentStatus.PENDING,
            )
        )
        order = pending.scalar_one_or_none()
        if not order:
            from src.modules.payments.models import FeeType

            order = PaymentOrder(
                user_id=user.id,
                ref_type="lab_booking",
                ref_id=booking_id,
                amount=amount,
                fee_type=FeeType.LAB_USAGE,
            )
            order = await self.repo.create_order(order)
            await self.db.flush()
        return await self.pay_order(order.id, user)
