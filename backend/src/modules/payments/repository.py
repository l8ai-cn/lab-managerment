import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.payments.models import PaymentOrder, PaymentStatus


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_order(self, order_id: uuid.UUID) -> PaymentOrder | None:
        result = await self.db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id))
        return result.scalar_one_or_none()

    async def list_orders(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        user_id: uuid.UUID | None = None,
        status: PaymentStatus | None = None,
    ) -> tuple[list[PaymentOrder], int]:
        query = select(PaymentOrder)
        if user_id:
            query = query.where(PaymentOrder.user_id == user_id)
        if status:
            query = query.where(PaymentOrder.status == status)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(PaymentOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_order(self, order: PaymentOrder) -> PaymentOrder:
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order
