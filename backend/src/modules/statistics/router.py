import io
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.experiment_projects.models import ExperimentProject
from src.modules.faults.models import FaultReport, FaultStatus
from src.modules.instruments.models import Instrument, InstrumentBooking
from src.modules.lab_bookings.models import LabBooking, LabBookingStatus, LabCheckIn
from src.modules.labs.models import Lab
from src.modules.users.models import User

router = APIRouter(prefix="/statistics", tags=["统计分析"])


class OverviewStats(BaseModel):
    lab_count: int
    instrument_count: int
    booking_count: int
    lab_booking_count: int
    fault_count: int
    pending_bookings: int
    pending_faults: int


class InstrumentUsageStats(BaseModel):
    by_lab: dict[str, int]
    by_category: dict[str, int]
    total_bookings: int


class LabUsageStats(BaseModel):
    total_hours: float
    person_times: int
    by_usage_type: dict[str, int]


class FaultStats(BaseModel):
    by_type: dict[str, int]
    by_lab: dict[str, int]
    by_status: dict[str, int]


class EquipmentValueStats(BaseModel):
    total_value: float
    by_category: dict[str, float]
    by_lab: dict[str, float]
    instrument_count: int


class ExperimentProjectStats(BaseModel):
    total_projects: int
    by_type: dict[str, int]
    by_semester: dict[str, int]
    total_hours: int


@router.get("/overview", response_model=OverviewStats)
async def overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lab_count = (await db.execute(select(func.count()).where(Lab.deleted_at.is_(None)))).scalar_one()
    instrument_count = (
        await db.execute(select(func.count()).where(Instrument.deleted_at.is_(None)))
    ).scalar_one()
    booking_count = (await db.execute(select(func.count()).select_from(InstrumentBooking))).scalar_one()
    lab_booking_count = (await db.execute(select(func.count()).select_from(LabBooking))).scalar_one()
    fault_count = (await db.execute(select(func.count()).select_from(FaultReport))).scalar_one()
    pending_bookings = (
        await db.execute(
            select(func.count()).where(
                LabBooking.status.in_([LabBookingStatus.PENDING, LabBookingStatus.APPROVED])
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
    return OverviewStats(
        lab_count=lab_count,
        instrument_count=instrument_count,
        booking_count=booking_count,
        lab_booking_count=lab_booking_count,
        fault_count=fault_count,
        pending_bookings=pending_bookings,
        pending_faults=pending_faults,
    )


@router.get("/instrument-usage", response_model=InstrumentUsageStats)
async def instrument_usage(
    lab_id: uuid.UUID | None = None,
    category: str | None = None,
    from_time: datetime | None = None,
    to_time: datetime | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(InstrumentBooking).join(Instrument, InstrumentBooking.instrument_id == Instrument.id)
    if lab_id:
        query = query.where(Instrument.lab_id == lab_id)
    if category:
        query = query.where(Instrument.category == category)
    if from_time:
        query = query.where(InstrumentBooking.end_time >= from_time)
    if to_time:
        query = query.where(InstrumentBooking.start_time <= to_time)
    result = await db.execute(query.options())
    bookings = list(result.scalars().all())

    by_lab: dict[str, int] = {}
    by_category: dict[str, int] = {}
    inst_ids = {b.instrument_id for b in bookings}
    if inst_ids:
        inst_result = await db.execute(select(Instrument).where(Instrument.id.in_(inst_ids)))
        inst_map = {i.id: i for i in inst_result.scalars().all()}
        for b in bookings:
            inst = inst_map.get(b.instrument_id)
            if inst:
                lab_name = str(inst.lab_id) if inst.lab_id else "未分配"
                by_lab[lab_name] = by_lab.get(lab_name, 0) + 1
                cat = inst.category or "未分类"
                by_category[cat] = by_category.get(cat, 0) + 1

    return InstrumentUsageStats(by_lab=by_lab, by_category=by_category, total_bookings=len(bookings))


@router.get("/lab-usage", response_model=LabUsageStats)
async def lab_usage(
    lab_id: uuid.UUID | None = None,
    from_time: datetime | None = None,
    to_time: datetime | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(LabBooking).where(LabBooking.status == LabBookingStatus.COMPLETED)
    if lab_id:
        query = query.where(LabBooking.lab_id == lab_id)
    if from_time:
        query = query.where(LabBooking.end_time >= from_time)
    if to_time:
        query = query.where(LabBooking.start_time <= to_time)
    result = await db.execute(query)
    bookings = list(result.scalars().all())

    total_hours = sum((b.end_time - b.start_time).total_seconds() / 3600 for b in bookings)
    person_times = sum(b.expected_count or 1 for b in bookings)
    by_usage_type: dict[str, int] = {}
    for b in bookings:
        by_usage_type[b.usage_type.value] = by_usage_type.get(b.usage_type.value, 0) + 1

    return LabUsageStats(
        total_hours=round(total_hours, 2),
        person_times=person_times,
        by_usage_type=by_usage_type,
    )


@router.get("/faults", response_model=FaultStats)
async def fault_statistics(
    lab_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FaultReport)
    if lab_id:
        query = query.where(FaultReport.lab_id == lab_id)
    result = await db.execute(query)
    reports = list(result.scalars().all())

    by_type: dict[str, int] = {}
    by_lab: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for r in reports:
        by_type[r.fault_type] = by_type.get(r.fault_type, 0) + 1
        by_lab[str(r.lab_id)] = by_lab.get(str(r.lab_id), 0) + 1
        by_status[r.status.value] = by_status.get(r.status.value, 0) + 1

    return FaultStats(by_type=by_type, by_lab=by_lab, by_status=by_status)


@router.get("/equipment-value", response_model=EquipmentValueStats)
async def equipment_value(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Instrument).where(Instrument.deleted_at.is_(None)))
    instruments = list(result.scalars().all())
    by_category: dict[str, float] = {}
    by_lab: dict[str, float] = {}
    total = 0.0
    for inst in instruments:
        price = float(inst.purchase_price or 0)
        total += price
        cat = inst.category or "未分类"
        by_category[cat] = by_category.get(cat, 0) + price
        lab_key = str(inst.lab_id) if inst.lab_id else "未分配"
        by_lab[lab_key] = by_lab.get(lab_key, 0) + price
    return EquipmentValueStats(
        total_value=round(total, 2),
        by_category={k: round(v, 2) for k, v in by_category.items()},
        by_lab={k: round(v, 2) for k, v in by_lab.items()},
        instrument_count=len(instruments),
    )


@router.get("/experiment-projects", response_model=ExperimentProjectStats)
async def experiment_project_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ExperimentProject))
    projects = list(result.scalars().all())
    by_type: dict[str, int] = {}
    by_semester: dict[str, int] = {}
    total_hours = 0
    for p in projects:
        by_type[p.type.value] = by_type.get(p.type.value, 0) + 1
        sem = p.semester or "未指定"
        by_semester[sem] = by_semester.get(sem, 0) + 1
        total_hours += p.hours or 0
    return ExperimentProjectStats(
        total_projects=len(projects),
        by_type=by_type,
        by_semester=by_semester,
        total_hours=total_hours,
    )


@router.get("/export/{export_type}")
async def export_statistics(
    export_type: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        import openpyxl
    except ImportError as e:
        from fastapi import HTTPException

        raise HTTPException(status_code=500, detail="openpyxl 未安装") from e

    wb = openpyxl.Workbook()
    ws = wb.active
    if export_type == "overview":
        ws.title = "概览统计"
        ws.append(["指标", "数值"])
        overview = await overview(user=user, db=db)
        for field, value in overview.model_dump().items():
            ws.append([field, value])
    elif export_type == "equipment-value":
        ws.title = "设备资产"
        ws.append(["分类", "价值"])
        ev = await equipment_value(user=user, db=db)
        ws.append(["总计", ev.total_value])
        for cat, val in ev.by_category.items():
            ws.append([cat, val])
    elif export_type == "faults":
        ws.title = "故障统计"
        fs = await fault_statistics(user=user, db=db)
        ws.append(["状态", "数量"])
        for k, v in fs.by_status.items():
            ws.append([k, v])
    else:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail=f"不支持的导出类型: {export_type}")

    import io

    buffer = io.BytesIO()
    wb.save(buffer)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=statistics_{export_type}.xlsx"},
    )
