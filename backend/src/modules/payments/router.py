import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.payments.models import PaymentStatus
from src.modules.payments.schemas import (
    PayResponse,
    PaymentOrderCreate,
    PaymentOrderListResponse,
    PaymentOrderResponse,
)
from src.modules.payments.service import PaymentService
from src.modules.users.models import User

router = APIRouter(prefix="/payments", tags=["支付"])


def get_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


@router.post("/orders", response_model=PaymentOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: PaymentOrderCreate,
    user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_service),
):
    return await service.create_order(data, user)


@router.post("/orders/{order_id}/pay", response_model=PayResponse)
async def pay_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_service),
):
    return await service.pay_order(order_id, user)


@router.get("/orders", response_model=PaymentOrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: PaymentStatus | None = None,
    user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_service),
):
    return await service.list_orders(page=page, page_size=page_size, user_id=user.id, status=status)
