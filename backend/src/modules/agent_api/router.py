import re
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.faults.models import FaultReport, FaultStatus
from src.modules.instruments.models import Instrument, InstrumentBooking
from src.modules.knowledge.service import KnowledgeService
from src.modules.lab_bookings.models import LabBooking
from src.modules.labs.models import Lab
from src.modules.statistics.router import OverviewStats, overview
from src.modules.users.models import User

router = APIRouter(prefix="/agent", tags=["Agent API"])

_FORBIDDEN_SQL = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)


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


class AgentInstrumentBookingSummary(BaseModel):
    id: uuid.UUID
    instrument_id: uuid.UUID
    instrument_name: str | None
    start_time: datetime
    end_time: datetime
    status: str


class AgentFaultSummary(BaseModel):
    id: uuid.UUID
    lab_id: uuid.UUID
    fault_type: str
    status: str
    description: str


class TextToSqlRequest(BaseModel):
    sql: str = Field(..., min_length=6, max_length=2000)


class TextToSqlResponse(BaseModel):
    columns: list[str]
    rows: list[list]
    row_count: int


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


@router.get("/instrument-bookings", response_model=list[AgentInstrumentBookingSummary])
async def agent_instrument_bookings(
    instrument_id: uuid.UUID | None = None,
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(InstrumentBooking)
    if instrument_id:
        query = query.where(InstrumentBooking.instrument_id == instrument_id)
    result = await db.execute(query.order_by(InstrumentBooking.start_time.desc()).limit(limit))
    bookings = result.scalars().all()
    inst_ids = {b.instrument_id for b in bookings}
    inst_map: dict[uuid.UUID, str] = {}
    if inst_ids:
        inst_result = await db.execute(select(Instrument).where(Instrument.id.in_(inst_ids)))
        inst_map = {i.id: i.name for i in inst_result.scalars().all()}
    return [
        AgentInstrumentBookingSummary(
            id=b.id,
            instrument_id=b.instrument_id,
            instrument_name=inst_map.get(b.instrument_id),
            start_time=b.start_time,
            end_time=b.end_time,
            status=b.status.value,
        )
        for b in bookings
    ]


@router.get("/faults", response_model=list[AgentFaultSummary])
async def agent_faults(
    status: FaultStatus | None = None,
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FaultReport)
    if status:
        query = query.where(FaultReport.status == status)
    result = await db.execute(query.order_by(FaultReport.created_at.desc()).limit(limit))
    reports = result.scalars().all()
    return [
        AgentFaultSummary(
            id=r.id,
            lab_id=r.lab_id,
            fault_type=r.fault_type,
            status=r.status.value,
            description=r.description[:200],
        )
        for r in reports
    ]


@router.get("/statistics/overview", response_model=OverviewStats)
async def agent_statistics_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await overview(user=user, db=db)


@router.post("/text-to-sql", response_model=TextToSqlResponse)
async def text_to_sql(
    body: TextToSqlRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sql = body.sql.strip().rstrip(";")
    if not sql.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="仅允许 SELECT 查询")
    if _FORBIDDEN_SQL.search(sql):
        raise HTTPException(status_code=400, detail="SQL 包含禁止的操作")
    if ";" in sql:
        raise HTTPException(status_code=400, detail="不允许多语句")
    limited_sql = f"SELECT * FROM ({sql}) AS _agent_q LIMIT 100"
    result = await db.execute(text(limited_sql))
    rows = result.fetchall()
    columns = list(result.keys()) if rows else []
    if not columns and result.keys():
        columns = list(result.keys())
    return TextToSqlResponse(
        columns=columns,
        rows=[list(row) for row in rows],
        row_count=len(rows),
    )


@router.get("/knowledge/search")
async def agent_knowledge_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=30),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    return await service.search(q, limit=limit)
