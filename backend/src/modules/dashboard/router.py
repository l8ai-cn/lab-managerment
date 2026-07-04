from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.faults.models import FaultReport, FaultStatus
from src.modules.instruments.models import Instrument
from src.modules.lab_bookings.models import LabBooking, LabBookingStatus
from src.modules.labs.models import Lab, OpenStatus
from src.modules.users.models import User

router = APIRouter(prefix="/dashboard", tags=["数据大屏"])


class DashboardOverview(BaseModel):
    total_labs: int
    open_labs: int
    total_instruments: int
    today_bookings: int
    active_bookings: int
    pending_faults: int
    online_users_estimate: int


class TrendPoint(BaseModel):
    date: str
    bookings: int
    faults: int
    usage_hours: float


class DashboardTrends(BaseModel):
    weekly: list[TrendPoint]


@router.get("/overview", response_model=DashboardOverview)
async def dashboard_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_labs = (await db.execute(select(func.count()).where(Lab.deleted_at.is_(None)))).scalar_one()
    open_labs = (
        await db.execute(
            select(func.count()).where(Lab.deleted_at.is_(None), Lab.open_status == OpenStatus.OPEN)
        )
    ).scalar_one()
    total_instruments = (
        await db.execute(select(func.count()).where(Instrument.deleted_at.is_(None)))
    ).scalar_one()
    today_bookings = (
        await db.execute(
            select(func.count()).where(LabBooking.created_at >= today_start)
        )
    ).scalar_one()
    active_bookings = (
        await db.execute(
            select(func.count()).where(
                LabBooking.status == LabBookingStatus.APPROVED,
                LabBooking.start_time <= now,
                LabBooking.end_time >= now,
            )
        )
    ).scalar_one()
    pending_faults = (
        await db.execute(
            select(func.count()).where(
                FaultReport.status.in_([FaultStatus.PENDING, FaultStatus.ASSIGNED, FaultStatus.PROCESSING])
            )
        )
    ).scalar_one()

    return DashboardOverview(
        total_labs=total_labs,
        open_labs=open_labs,
        total_instruments=total_instruments,
        today_bookings=today_bookings,
        active_bookings=active_bookings,
        pending_faults=pending_faults,
        online_users_estimate=active_bookings * 3 + 5,
    )


@router.get("/trends", response_model=DashboardTrends)
async def dashboard_trends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    points: list[TrendPoint] = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day + timedelta(days=1)
        bookings = (
            await db.execute(
                select(func.count()).where(LabBooking.created_at >= day, LabBooking.created_at < day_end)
            )
        ).scalar_one()
        faults = (
            await db.execute(
                select(func.count()).where(FaultReport.created_at >= day, FaultReport.created_at < day_end)
            )
        ).scalar_one()
        result = await db.execute(
            select(LabBooking).where(
                LabBooking.status == LabBookingStatus.COMPLETED,
                LabBooking.start_time >= day,
                LabBooking.start_time < day_end,
            )
        )
        completed = list(result.scalars().all())
        hours = sum((b.end_time - b.start_time).total_seconds() / 3600 for b in completed)
        points.append(
            TrendPoint(date=day.strftime("%Y-%m-%d"), bookings=bookings, faults=faults, usage_hours=round(hours, 1))
        )
    return DashboardTrends(weekly=points)
