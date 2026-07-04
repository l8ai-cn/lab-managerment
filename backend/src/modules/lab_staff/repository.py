import uuid
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.lab_staff.models import LabStaff, LabStaffAssignment
from src.modules.labs.models import Lab


class LabStaffRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self):
        return (
            select(LabStaff)
            .where(LabStaff.deleted_at.is_(None))
            .options(
                selectinload(LabStaff.assignments).selectinload(LabStaffAssignment.lab),
            )
        )

    async def get_by_id(self, staff_id: uuid.UUID) -> LabStaff | None:
        result = await self.db.execute(self._base_query().where(LabStaff.id == staff_id))
        return result.scalar_one_or_none()

    async def get_by_employee_no(self, employee_no: str) -> LabStaff | None:
        result = await self.db.execute(
            self._base_query().where(LabStaff.employee_no == employee_no)
        )
        return result.scalar_one_or_none()

    async def list_staff(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        lab_id: uuid.UUID | None = None,
        keyword: str | None = None,
    ) -> tuple[list[LabStaff], int]:
        query = self._base_query()
        if lab_id:
            query = query.join(LabStaffAssignment).where(LabStaffAssignment.lab_id == lab_id)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(
                or_(LabStaff.name.ilike(pattern), LabStaff.employee_no.ilike(pattern))
            )
        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()
        query = query.order_by(LabStaff.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def create(self, staff: LabStaff) -> LabStaff:
        self.db.add(staff)
        await self.db.flush()
        await self.db.refresh(staff)
        return staff

    async def set_lab_assignments(self, staff_id: uuid.UUID, lab_ids: list[uuid.UUID]) -> None:
        await self.db.execute(
            LabStaffAssignment.__table__.delete().where(LabStaffAssignment.staff_id == staff_id)
        )
        for lab_id in lab_ids:
            self.db.add(LabStaffAssignment(staff_id=staff_id, lab_id=lab_id))
        await self.db.flush()

    async def soft_delete(self, staff: LabStaff) -> None:
        staff.deleted_at = datetime.now(tz=datetime.now().astimezone().tzinfo)
        await self.db.flush()

    async def labs_exist(self, lab_ids: list[uuid.UUID]) -> bool:
        if not lab_ids:
            return True
        result = await self.db.execute(
            select(func.count()).where(Lab.id.in_(lab_ids), Lab.deleted_at.is_(None))
        )
        return result.scalar_one() == len(lab_ids)
