import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.instruments.models import (
    BookingStatus,
    Instrument,
    InstrumentBooking,
    InstrumentBookingApproval,
    InstrumentBookingRule,
    InstrumentStatus,
    InstrumentStatusLog,
    InstrumentUsageRecord,
    ReviewStatus,
)


class InstrumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_instrument(self, instrument_id: uuid.UUID) -> Instrument | None:
        result = await self.db.execute(
            select(Instrument).where(Instrument.id == instrument_id, Instrument.deleted_at.is_(None))
            .options(selectinload(Instrument.lab))
        )
        return result.scalar_one_or_none()

    async def list_instruments(self, *, page=1, page_size=20, lab_id=None, category=None, status=None, keyword=None):
        query = select(Instrument).where(Instrument.deleted_at.is_(None)).options(selectinload(Instrument.lab))
        if lab_id:
            query = query.where(Instrument.lab_id == lab_id)
        if category:
            query = query.where(Instrument.category == category)
        if status:
            query = query.where(Instrument.status == status)
        if keyword:
            p = f"%{keyword}%"
            query = query.where(or_(Instrument.name.ilike(p), Instrument.code.ilike(p), Instrument.asset_no.ilike(p)))
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(query.order_by(Instrument.created_at.desc()).offset((page-1)*page_size).limit(page_size))
        return list(result.scalars().all()), total

    async def create_instrument(self, inst: Instrument) -> Instrument:
        self.db.add(inst)
        await self.db.flush()
        await self.db.refresh(inst)
        return inst

    async def get_instrument_by_code(self, code: str) -> Instrument | None:
        result = await self.db.execute(
            select(Instrument).where(Instrument.code == code, Instrument.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_max_code_seq(self, year: int) -> int:
        prefix = f"INS-{year}-"
        result = await self.db.execute(select(Instrument.code).where(Instrument.code.like(f"{prefix}%")).order_by(Instrument.code.desc()).limit(1))
        last = result.scalar_one_or_none()
        return int(last.split("-")[-1]) if last else 0

    async def get_rule(self, instrument_id: uuid.UUID) -> InstrumentBookingRule | None:
        result = await self.db.execute(select(InstrumentBookingRule).where(InstrumentBookingRule.instrument_id == instrument_id))
        return result.scalar_one_or_none()

    async def save_rule(self, rule: InstrumentBookingRule) -> InstrumentBookingRule:
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def list_bookings(self, *, page=1, page_size=20, instrument_id=None, user_id=None, status=None, from_time=None, to_time=None):
        query = select(InstrumentBooking).options(selectinload(InstrumentBooking.instrument))
        if instrument_id:
            query = query.where(InstrumentBooking.instrument_id == instrument_id)
        if user_id:
            query = query.where(InstrumentBooking.user_id == user_id)
        if status:
            query = query.where(InstrumentBooking.status == status)
        if from_time:
            query = query.where(InstrumentBooking.end_time >= from_time)
        if to_time:
            query = query.where(InstrumentBooking.start_time <= to_time)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(query.order_by(InstrumentBooking.start_time.desc()).offset((page-1)*page_size).limit(page_size))
        return list(result.scalars().all()), total

    async def get_booking(self, booking_id: uuid.UUID) -> InstrumentBooking | None:
        result = await self.db.execute(
            select(InstrumentBooking).where(InstrumentBooking.id == booking_id)
            .options(selectinload(InstrumentBooking.instrument), selectinload(InstrumentBooking.usage_record))
        )
        return result.scalar_one_or_none()

    async def create_booking(self, booking: InstrumentBooking) -> InstrumentBooking:
        self.db.add(booking)
        await self.db.flush()
        await self.db.refresh(booking)
        return booking

    async def overlapping_bookings(self, instrument_id: uuid.UUID, start: datetime, end: datetime, exclude_id: uuid.UUID | None = None):
        query = select(InstrumentBooking).where(
            InstrumentBooking.instrument_id == instrument_id,
            InstrumentBooking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.IN_USE]),
            InstrumentBooking.start_time < end,
            InstrumentBooking.end_time > start,
        )
        if exclude_id:
            query = query.where(InstrumentBooking.id != exclude_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_approval(self, record: InstrumentBookingApproval) -> None:
        self.db.add(record)
        await self.db.flush()

    async def get_usage(self, booking_id: uuid.UUID) -> InstrumentUsageRecord | None:
        result = await self.db.execute(select(InstrumentUsageRecord).where(InstrumentUsageRecord.booking_id == booking_id))
        return result.scalar_one_or_none()

    async def save_usage(self, record: InstrumentUsageRecord) -> InstrumentUsageRecord:
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def add_status_log(self, log: InstrumentStatusLog) -> None:
        self.db.add(log)
        await self.db.flush()

    async def soft_delete(self, inst: Instrument) -> None:
        inst.deleted_at = datetime.now(UTC)
        await self.db.flush()
