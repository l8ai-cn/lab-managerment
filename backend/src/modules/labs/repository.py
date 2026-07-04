import uuid
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.labs.models import Lab, LabType, OpenStatus
from src.modules.spaces.models import Building, Floor, Room


class LabRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self):
        return (
            select(Lab)
            .where(Lab.deleted_at.is_(None))
            .options(selectinload(Lab.room).selectinload(Room.floor).selectinload(Floor.building))
        )

    async def get_by_id(self, lab_id: uuid.UUID) -> Lab | None:
        result = await self.db.execute(self._base_query().where(Lab.id == lab_id))
        return result.scalar_one_or_none()

    async def list_labs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        building_id: uuid.UUID | None = None,
        floor_id: uuid.UUID | None = None,
        lab_type: LabType | None = None,
        open_status: OpenStatus | None = None,
        open_statuses: list[OpenStatus] | None = None,
        keyword: str | None = None,
        manager_id: uuid.UUID | None = None,
    ) -> tuple[list[Lab], int]:
        query = self._base_query()

        if building_id:
            query = (
                query.join(Room, Lab.room_id == Room.id, isouter=True)
                .join(Floor, Room.floor_id == Floor.id, isouter=True)
                .where(Floor.building_id == building_id)
            )
        if floor_id:
            query = (
                query.join(Room, Lab.room_id == Room.id, isouter=True)
                .where(Room.floor_id == floor_id)
            )
        if lab_type:
            query = query.where(Lab.lab_type == lab_type)
        if open_status:
            query = query.where(Lab.open_status == open_status)
        if open_statuses:
            query = query.where(Lab.open_status.in_(open_statuses))
        if manager_id:
            query = query.where(Lab.manager_id == manager_id)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(or_(Lab.name.ilike(pattern), Lab.code.ilike(pattern)))

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(Lab.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def create(self, lab: Lab) -> Lab:
        self.db.add(lab)
        await self.db.flush()
        await self.db.refresh(lab)
        return lab

    async def update(self, lab: Lab) -> Lab:
        await self.db.flush()
        await self.db.refresh(lab)
        return lab

    async def soft_delete(self, lab: Lab) -> None:
        lab.deleted_at = datetime.now(tz=datetime.now().astimezone().tzinfo)
        await self.db.flush()

    async def get_max_code_seq(self, year: int) -> int:
        prefix = f"LAB-{year}-"
        result = await self.db.execute(
            select(Lab.code)
            .where(Lab.code.like(f"{prefix}%"))
            .order_by(Lab.code.desc())
            .limit(1)
        )
        last_code = result.scalar_one_or_none()
        if not last_code:
            return 0
        return int(last_code.split("-")[-1])

    async def list_all_for_export(self) -> list[Lab]:
        result = await self.db.execute(
            self._base_query().order_by(Lab.code)
        )
        return list(result.scalars().unique().all())
