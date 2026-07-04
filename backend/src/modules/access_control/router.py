import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.access_control.models import AccessControlDevice, DoorEvent, DoorEventType
from src.modules.lab_bookings.models import LabAccessGrant, LabBooking, LabBookingStatus
from src.modules.labs.models import Lab
from src.modules.users.models import User

router = APIRouter(prefix="/access-control", tags=["门禁/班牌"])


class DeviceResponse(BaseModel):
    id: uuid.UUID
    device_code: str
    name: str
    lab_id: uuid.UUID | None
    location: str | None
    device_type: str
    is_online: bool


class DoorOpenRequest(BaseModel):
    access_token: str


class DoorOpenResponse(BaseModel):
    success: bool
    message: str
    event_id: uuid.UUID | None = None


class ClassBoardBookingItem(BaseModel):
    start_time: datetime
    end_time: datetime
    usage_type: str
    purpose: str
    status: str


class ClassBoardDisplayResponse(BaseModel):
    device_id: uuid.UUID
    device_name: str
    lab_id: uuid.UUID | None
    lab_name: str | None
    lab_open_status: str | None
    inspection_status: str | None
    today_bookings: list[ClassBoardBookingItem]
    current_status: str
    updated_at: datetime


@router.get("/devices", response_model=list[DeviceResponse])
async def list_devices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AccessControlDevice).order_by(AccessControlDevice.device_code))
    devices = result.scalars().all()
    return [
        DeviceResponse(
            id=d.id,
            device_code=d.device_code,
            name=d.name,
            lab_id=d.lab_id,
            location=d.location,
            device_type=d.device_type,
            is_online=d.is_online,
        )
        for d in devices
    ]


@router.post("/devices/{device_id}/open", response_model=DoorOpenResponse)
async def simulate_door_open(
    device_id: uuid.UUID,
    body: DoorOpenRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    device_result = await db.execute(select(AccessControlDevice).where(AccessControlDevice.id == device_id))
    device = device_result.scalar_one_or_none()
    if not device:
        return DoorOpenResponse(success=False, message="设备不存在")

    grant_result = await db.execute(
        select(LabAccessGrant)
        .join(LabBooking, LabAccessGrant.booking_id == LabBooking.id)
        .where(
            LabAccessGrant.access_token == body.access_token,
            LabBooking.status == LabBookingStatus.APPROVED,
        )
    )
    grant = grant_result.scalar_one_or_none()

    if not grant:
        event = DoorEvent(
            device_id=device_id,
            user_id=user.id,
            event_type=DoorEventType.DENIED,
            access_token=body.access_token,
            message="无效或过期的门禁凭证",
        )
        db.add(event)
        await db.commit()
        return DoorOpenResponse(success=False, message="门禁凭证无效或预约未批准", event_id=event.id)

    booking_result = await db.execute(select(LabBooking).where(LabBooking.id == grant.booking_id))
    booking = booking_result.scalar_one_or_none()
    if device.lab_id and booking and booking.lab_id != device.lab_id:
        event = DoorEvent(
            device_id=device_id,
            user_id=booking.user_id,
            event_type=DoorEventType.DENIED,
            access_token=body.access_token,
            message="门禁设备与预约实验室不匹配",
        )
        db.add(event)
        await db.commit()
        return DoorOpenResponse(success=False, message="该门禁不属于预约实验室", event_id=event.id)

    event = DoorEvent(
        device_id=device_id,
        user_id=booking.user_id if booking else user.id,
        event_type=DoorEventType.OPEN,
        access_token=body.access_token,
        message="门禁开启成功",
    )
    db.add(event)
    await db.commit()
    return DoorOpenResponse(success=True, message="门禁开启成功", event_id=event.id)


@router.get("/class-boards", response_model=list[DeviceResponse])
async def list_class_boards(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AccessControlDevice)
        .where(AccessControlDevice.device_type == "class_board")
        .order_by(AccessControlDevice.device_code)
    )
    devices = result.scalars().all()
    return [
        DeviceResponse(
            id=d.id,
            device_code=d.device_code,
            name=d.name,
            lab_id=d.lab_id,
            location=d.location,
            device_type=d.device_type,
            is_online=d.is_online,
        )
        for d in devices
    ]


@router.get("/class-boards/{device_id}/display", response_model=ClassBoardDisplayResponse)
async def get_class_board_display(
    device_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    device_result = await db.execute(
        select(AccessControlDevice).where(AccessControlDevice.id == device_id)
    )
    device = device_result.scalar_one_or_none()
    if not device:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班牌设备不存在")

    lab = None
    if device.lab_id:
        lab_result = await db.execute(select(Lab).where(Lab.id == device.lab_id))
        lab = lab_result.scalar_one_or_none()

    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    bookings: list[ClassBoardBookingItem] = []
    current_status = "空闲"
    if device.lab_id:
        booking_result = await db.execute(
            select(LabBooking)
            .where(
                LabBooking.lab_id == device.lab_id,
                LabBooking.start_time < today_end,
                LabBooking.end_time > today_start,
                LabBooking.status.in_([LabBookingStatus.APPROVED, LabBookingStatus.COMPLETED, LabBookingStatus.PENDING]),
            )
            .order_by(LabBooking.start_time)
        )
        for b in booking_result.scalars().all():
            bookings.append(
                ClassBoardBookingItem(
                    start_time=b.start_time,
                    end_time=b.end_time,
                    usage_type=b.usage_type.value,
                    purpose=b.purpose,
                    status=b.status.value,
                )
            )
            if b.start_time <= now <= b.end_time and b.status in (LabBookingStatus.APPROVED, LabBookingStatus.COMPLETED):
                current_status = "使用中"

    return ClassBoardDisplayResponse(
        device_id=device.id,
        device_name=device.name,
        lab_id=device.lab_id,
        lab_name=lab.name if lab else None,
        lab_open_status=lab.open_status.value if lab else None,
        inspection_status=lab.inspection_status.value if lab else None,
        today_bookings=bookings,
        current_status=current_status,
        updated_at=now,
    )
