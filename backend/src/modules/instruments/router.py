import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.instruments.models import BookingStatus, InstrumentStatus
from src.modules.instruments.schemas import (
    ApprovalRequest,
    BookingListResponse,
    BookingRuleCreate,
    BookingRuleResponse,
    CalendarSlot,
    InstrumentBookingCreate,
    InstrumentBookingResponse,
    InstrumentCreate,
    InstrumentListResponse,
    InstrumentResponse,
    InstrumentUpdate,
    StatusChangeRequest,
    UsageRecordCreate,
    UsageRecordResponse,
    BatchUsageReviewRequest,
    BatchUsageReviewResponse,
    PendingInstrumentUsageListResponse,
)
from src.modules.instruments.service import InstrumentService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/instruments", tags=["仪器设备"])


def svc(db: AsyncSession = Depends(get_db)) -> InstrumentService:
    return InstrumentService(db)


@router.get("", response_model=InstrumentListResponse)
async def list_instruments(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    lab_id: uuid.UUID | None = None, category: str | None = None,
    status: InstrumentStatus | None = None, keyword: str | None = None,
    user: User = Depends(get_current_user), service: InstrumentService = Depends(svc),
):
    return await service.list(page=page, page_size=page_size, lab_id=lab_id, category=category, status=status, keyword=keyword)


@router.post("", response_model=InstrumentResponse)
async def create_instrument(
    data: InstrumentCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: InstrumentService = Depends(svc),
):
    return await service.create(data)


@router.get("/export")
async def export_instruments(
    fmt: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    lab_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    service: InstrumentService = Depends(svc),
):
    content, media_type, filename = await service.export_instruments(fmt=fmt, lab_id=lab_id)
    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/import")
async def import_instruments(
    file: UploadFile = File(...),
    user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: InstrumentService = Depends(svc),
):
    return await service.import_instruments(file, user)


@router.get("/{instrument_id}", response_model=InstrumentResponse)
async def get_instrument(instrument_id: uuid.UUID, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.get(instrument_id)


@router.patch("/{instrument_id}", response_model=InstrumentResponse)
async def update_instrument(instrument_id: uuid.UUID, data: InstrumentUpdate, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.update(instrument_id, data, user)


@router.post("/{instrument_id}/status", response_model=InstrumentResponse)
async def change_status(instrument_id: uuid.UUID, data: StatusChangeRequest, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.change_status(instrument_id, data, user)


@router.post("/booking-rules", response_model=BookingRuleResponse)
async def set_booking_rule(data: BookingRuleCreate, _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)), service: InstrumentService = Depends(svc)):
    return await service.set_rule(data)


@router.get("/{instrument_id}/booking-rules", response_model=BookingRuleResponse)
async def get_booking_rule(instrument_id: uuid.UUID, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.get_rule(instrument_id)


@router.get("/{instrument_id}/calendar", response_model=list[CalendarSlot])
async def get_calendar(instrument_id: uuid.UUID, from_time: datetime, to_time: datetime, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.calendar(instrument_id, from_time, to_time)


bookings_router = APIRouter(prefix="/instrument-bookings", tags=["仪器预约"])


@bookings_router.get("", response_model=BookingListResponse)
async def list_bookings(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    instrument_id: uuid.UUID | None = None, status: BookingStatus | None = None,
    user: User = Depends(get_current_user), service: InstrumentService = Depends(svc),
):
    return await service.list_bookings(page=page, page_size=page_size, instrument_id=instrument_id, user_id=user.id if user.role == UserRole.STUDENT else None, status=status)


@bookings_router.post("", response_model=InstrumentBookingResponse)
async def create_booking(data: InstrumentBookingCreate, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.create_booking(data, user)


@bookings_router.post("/{booking_id}/approve", response_model=InstrumentBookingResponse)
async def approve_booking(booking_id: uuid.UUID, body: ApprovalRequest = ApprovalRequest(), user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)), service: InstrumentService = Depends(svc)):
    return await service.approve_booking(booking_id, user, body)


@bookings_router.post("/{booking_id}/reject", response_model=InstrumentBookingResponse)
async def reject_booking(booking_id: uuid.UUID, body: ApprovalRequest, user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)), service: InstrumentService = Depends(svc)):
    return await service.reject_booking(booking_id, user, body)


@bookings_router.get("/usage/pending", response_model=PendingInstrumentUsageListResponse)
async def list_pending_instrument_usage(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: InstrumentService = Depends(svc),
):
    return await service.list_pending_usage(page=page, page_size=page_size)


@bookings_router.post("/usage/batch-review", response_model=BatchUsageReviewResponse)
async def batch_review_instrument_usage(
    body: BatchUsageReviewRequest,
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: InstrumentService = Depends(svc),
):
    return await service.batch_review_usage(body.booking_ids, body.approve, user, body.comment)


@bookings_router.post("/{booking_id}/usage", response_model=UsageRecordResponse)
async def submit_usage(booking_id: uuid.UUID, data: UsageRecordCreate, user: User = Depends(get_current_user), service: InstrumentService = Depends(svc)):
    return await service.submit_usage(booking_id, data, user)


@bookings_router.post("/{booking_id}/usage/approve", response_model=UsageRecordResponse)
async def approve_usage(booking_id: uuid.UUID, body: ApprovalRequest = ApprovalRequest(), user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)), service: InstrumentService = Depends(svc)):
    return await service.review_usage(booking_id, True, user, body.comment)


@bookings_router.post("/{booking_id}/usage/reject", response_model=UsageRecordResponse)
async def reject_usage(booking_id: uuid.UUID, body: ApprovalRequest, user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)), service: InstrumentService = Depends(svc)):
    return await service.review_usage(booking_id, False, user, body.comment)
