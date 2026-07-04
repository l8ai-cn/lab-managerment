import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.lab_bookings.models import LabBookingStatus
from src.modules.lab_bookings.schemas import (
    AccessGrantResponse,
    ApprovalRequest,
    BookingRuleCreate,
    BookingRuleResponse,
    BookingRuleUpdate,
    CalendarSlot,
    CheckInCreate,
    CheckInResponse,
    LabBookingCreate,
    LabBookingListResponse,
    LabBookingResponse,
    LabBookingUpdate,
    UsageRecordCreate,
    UsageRecordResponse,
)
from src.modules.lab_bookings.service import LabBookingService
from src.modules.payments.schemas import PayResponse
from src.modules.payments.service import PaymentService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/lab-bookings", tags=["实验室预约"])


def get_service(db: AsyncSession = Depends(get_db)) -> LabBookingService:
    return LabBookingService(db)


@router.get("", response_model=LabBookingListResponse)
async def list_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    lab_id: uuid.UUID | None = None,
    status: LabBookingStatus | None = None,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    user_id = user.id if user.role == UserRole.STUDENT else None
    return await service.list_bookings(
        page=page, page_size=page_size, lab_id=lab_id, user_id=user_id, status=status
    )


@router.post("", response_model=LabBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: LabBookingCreate,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.create_booking(data, user)


def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


@router.get("/export")
async def export_bookings(
    fmt: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    lab_id: uuid.UUID | None = None,
    status: LabBookingStatus | None = None,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    user_id = user.id if user.role == UserRole.STUDENT else None
    content, media_type, filename = await service.export_bookings(
        fmt=fmt, lab_id=lab_id, user_id=user_id, status=status
    )
    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/calendar", response_model=list[CalendarSlot])
async def get_calendar(
    lab_id: uuid.UUID,
    from_time: datetime,
    to_time: datetime,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.calendar(lab_id, from_time, to_time)


@router.get("/{booking_id}/access-grants", response_model=list[AccessGrantResponse])
async def get_access_grants(
    booking_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.get_access_grants(booking_id)


@router.post("/{booking_id}/pay", response_model=PayResponse)
async def pay_lab_booking(
    booking_id: uuid.UUID,
    user: User = Depends(get_current_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    return await payment_service.pay_for_lab_booking(booking_id, user)


@router.get("/{booking_id}", response_model=LabBookingResponse)
async def get_booking(
    booking_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.get_booking(booking_id)


@router.patch("/{booking_id}", response_model=LabBookingResponse)
async def update_booking(
    booking_id: uuid.UUID,
    data: LabBookingUpdate,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.update_booking(booking_id, data, user)


@router.post("/{booking_id}/cancel", response_model=LabBookingResponse)
async def cancel_booking(
    booking_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.cancel_booking(booking_id, user)


@router.post("/{booking_id}/approve", response_model=LabBookingResponse)
async def approve_booking(
    booking_id: uuid.UUID,
    body: ApprovalRequest = ApprovalRequest(),
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.approve_booking(booking_id, user, body)


@router.post("/{booking_id}/reject", response_model=LabBookingResponse)
async def reject_booking(
    booking_id: uuid.UUID,
    body: ApprovalRequest,
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.reject_booking(booking_id, user, body)


@router.post("/{booking_id}/check-in", response_model=CheckInResponse)
async def check_in(
    booking_id: uuid.UUID,
    data: CheckInCreate,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.check_in(booking_id, data, user)


@router.post("/{booking_id}/usage", response_model=UsageRecordResponse)
async def submit_usage(
    booking_id: uuid.UUID,
    data: UsageRecordCreate,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.submit_usage(booking_id, data, user)


@router.post("/{booking_id}/usage/approve", response_model=UsageRecordResponse)
async def approve_usage(
    booking_id: uuid.UUID,
    body: ApprovalRequest = ApprovalRequest(),
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.review_usage(booking_id, True, user, body.comment)


@router.post("/{booking_id}/usage/reject", response_model=UsageRecordResponse)
async def reject_usage(
    booking_id: uuid.UUID,
    body: ApprovalRequest,
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.review_usage(booking_id, False, user, body.comment)


rules_router = APIRouter(prefix="/lab-booking-rules", tags=["实验室预约规则"])


@rules_router.post("", response_model=BookingRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: BookingRuleCreate,
    _: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.create_rule(data)


@rules_router.get("/{lab_id}", response_model=BookingRuleResponse)
async def get_rule(
    lab_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabBookingService = Depends(get_service),
):
    return await service.get_rule(lab_id)


@rules_router.patch("/{lab_id}", response_model=BookingRuleResponse)
async def update_rule(
    lab_id: uuid.UUID,
    data: BookingRuleUpdate,
    _: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    return await service.update_rule(lab_id, data)


@rules_router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    lab_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: LabBookingService = Depends(get_service),
):
    await service.delete_rule(lab_id)
