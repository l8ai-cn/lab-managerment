import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.instruments.models import Instrument
from src.modules.lab_bookings.models import LabBooking
from src.modules.labs.models import Lab
from src.modules.users.models import User

router = APIRouter(prefix="/agent", tags=["Agent API"])


class AgentLabSummary(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    open_status: str
    capacity: int | None


class AgentInstrumentSummary(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    category: str | None
    lab_id: uuid.UUID | None
    status: str


class AgentBookingSummary(BaseModel):
    id: uuid.UUID
    lab_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    usage_type: str
    status: str


@router.get("/labs", response_model=list[AgentLabSummary])
async def agent_labs(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lab).where(Lab.deleted_at.is_(None)).order_by(Lab.code).limit(limit)
    )
    labs = result.scalars().all()
    return [
        AgentLabSummary(
            id=lab.id,
            code=lab.code,
            name=lab.name,
            open_status=lab.open_status.value,
            capacity=lab.capacity,
        )
        for lab in labs
    ]


@router.get("/instruments", response_model=list[AgentInstrumentSummary])
async def agent_instruments(
    lab_id: uuid.UUID | None = None,
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Instrument).where(Instrument.deleted_at.is_(None))
    if lab_id:
        query = query.where(Instrument.lab_id == lab_id)
    result = await db.execute(query.order_by(Instrument.code).limit(limit))
    instruments = result.scalars().all()
    return [
        AgentInstrumentSummary(
            id=i.id,
            code=i.code,
            name=i.name,
            category=i.category,
            lab_id=i.lab_id,
            status=i.status.value,
        )
        for i in instruments
    ]


@router.get("/bookings", response_model=list[AgentBookingSummary])
async def agent_bookings(
    lab_id: uuid.UUID | None = None,
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(LabBooking)
    if lab_id:
        query = query.where(LabBooking.lab_id == lab_id)
    result = await db.execute(query.order_by(LabBooking.start_time.desc()).limit(limit))
    bookings = result.scalars().all()
    return [
        AgentBookingSummary(
            id=b.id,
            lab_id=b.lab_id,
            start_time=b.start_time,
            end_time=b.end_time,
            usage_type=b.usage_type.value,
            status=b.status.value,
        )
        for b in bookings
    ]
