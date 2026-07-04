import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.lab_bookings.models import (
    LabAccessGrant,
    LabBooking,
    LabBookingApproval,
    LabBookingRule,
    LabBookingStatus,
    LabCheckIn,
    LabUsageRecord,
)


class LabBookingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_rule(self, lab_id: uuid.UUID) -> LabBookingRule | None:
        result = await self.db.execute(select(LabBookingRule).where(LabBookingRule.lab_id == lab_id))
        return result.scalar_one_or_none()

    async def get_rule_by_id(self, rule_id: uuid.UUID) -> LabBookingRule | None:
        result = await self.db.execute(select(LabBookingRule).where(LabBookingRule.id == rule_id))
        return result.scalar_one_or_none()

    async def list_rules(self, *, page: int = 1, page_size: int = 20) -> tuple[list[LabBookingRule], int]:
        query = select(LabBookingRule)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(LabBookingRule.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def save_rule(self, rule: LabBookingRule) -> LabBookingRule:
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def delete_rule(self, rule: LabBookingRule) -> None:
        await self.db.delete(rule)
        await self.db.flush()

    async def get_booking(self, booking_id: uuid.UUID) -> LabBooking | None:
        result = await self.db.execute(
            select(LabBooking)
            .where(LabBooking.id == booking_id)
            .options(
                selectinload(LabBooking.lab),
                selectinload(LabBooking.approvals),
                selectinload(LabBooking.check_ins),
                selectinload(LabBooking.access_grants),
                selectinload(LabBooking.usage_record),
            )
        )
        return result.scalar_one_or_none()

    async def list_bookings(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        lab_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        status: LabBookingStatus | None = None,
        from_time: datetime | None = None,
        to_time: datetime | None = None,
    ) -> tuple[list[LabBooking], int]:
        query = select(LabBooking).options(selectinload(LabBooking.lab))
        if lab_id:
            query = query.where(LabBooking.lab_id == lab_id)
        if user_id:
            query = query.where(LabBooking.user_id == user_id)
        if status:
            query = query.where(LabBooking.status == status)
        if from_time:
            query = query.where(LabBooking.end_time >= from_time)
        if to_time:
            query = query.where(LabBooking.start_time <= to_time)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(LabBooking.start_time.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_booking(self, booking: LabBooking) -> LabBooking:
        self.db.add(booking)
        await self.db.flush()
        await self.db.refresh(booking)
        return booking

    async def overlapping_bookings(
        self, lab_id: uuid.UUID, start: datetime, end: datetime, exclude_id: uuid.UUID | None = None
    ) -> list[LabBooking]:
        query = select(LabBooking).where(
            LabBooking.lab_id == lab_id,
            LabBooking.status.in_([LabBookingStatus.PENDING, LabBookingStatus.APPROVED]),
            LabBooking.start_time < end,
            LabBooking.end_time > start,
        )
        if exclude_id:
            query = query.where(LabBooking.id != exclude_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_approval(self, record: LabBookingApproval) -> None:
        self.db.add(record)
        await self.db.flush()

    async def add_check_in(self, check_in: LabCheckIn) -> LabCheckIn:
        self.db.add(check_in)
        await self.db.flush()
        await self.db.refresh(check_in)
        return check_in

    async def add_access_grant(self, grant: LabAccessGrant) -> LabAccessGrant:
        self.db.add(grant)
        await self.db.flush()
        await self.db.refresh(grant)
        return grant

    async def get_usage(self, booking_id: uuid.UUID) -> LabUsageRecord | None:
        result = await self.db.execute(select(LabUsageRecord).where(LabUsageRecord.booking_id == booking_id))
        return result.scalar_one_or_none()

    async def save_usage(self, record: LabUsageRecord) -> LabUsageRecord:
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def list_pending_usage(self, *, page: int = 1, page_size: int = 50) -> tuple[list[LabUsageRecord], int]:
        from src.modules.lab_bookings.models import UsageReviewStatus

        query = (
            select(LabUsageRecord)
            .join(LabBooking, LabUsageRecord.booking_id == LabBooking.id)
            .where(LabUsageRecord.review_status == UsageReviewStatus.PENDING)
            .options(selectinload(LabUsageRecord.booking).selectinload(LabBooking.lab))
        )
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(LabUsageRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total
