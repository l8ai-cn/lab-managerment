import secrets
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.payments.models import PaymentOrder, PaymentStatus
from src.modules.payments.repository import PaymentRepository
from src.modules.payments.schemas import (
    PayResponse,
    PaymentOrderCreate,
    PaymentOrderListResponse,
    PaymentOrderResponse,
)
from src.modules.users.models import User


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
        bank_ref = f"BOC{secrets.token_hex(8).upper()}"
        order.status = PaymentStatus.PAID
        order.bank_ref = bank_ref
        order.paid_at = datetime.now(UTC)
        await self.db.commit()
        return PayResponse(
            order_id=order_id,
            status=PaymentStatus.PAID,
            bank_ref=bank_ref,
            message="中国银行支付成功（模拟）",
        )

    async def list_orders(self, **kwargs) -> PaymentOrderListResponse:
        items, total = await self.repo.list_orders(**kwargs)
        return PaymentOrderListResponse(
            items=[_order_response(o) for o in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )
