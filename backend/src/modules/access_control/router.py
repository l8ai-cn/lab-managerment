import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.access_control.models import AccessControlDevice, DoorEvent, DoorEventType
from src.modules.lab_bookings.models import LabAccessGrant, LabBooking, LabBookingStatus
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
