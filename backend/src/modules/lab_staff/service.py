import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.lab_staff.models import LabStaff
from src.modules.lab_staff.repository import LabStaffRepository
from src.modules.lab_staff.schemas import (
    LabBrief,
    LabStaffCreate,
    LabStaffListResponse,
    LabStaffResponse,
    LabStaffUpdate,
)


def _to_response(staff: LabStaff) -> LabStaffResponse:
    labs = [
        LabBrief(id=a.lab.id, code=a.lab.code, name=a.lab.name)
        for a in staff.assignments
        if a.lab and not a.lab.deleted_at
    ]
    return LabStaffResponse(
        id=staff.id,
        user_id=staff.user_id,
        employee_no=staff.employee_no,
        name=staff.name,
        phone=staff.phone,
        office_location=staff.office_location,
        labs=labs,
        created_at=staff.created_at,
        updated_at=staff.updated_at,
    )


class LabStaffService:
    def __init__(self, db: AsyncSession):
        self.repo = LabStaffRepository(db)
        self.db = db

    async def create(self, data: LabStaffCreate) -> LabStaffResponse:
        if await self.repo.get_by_employee_no(data.employee_no):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="工号已存在")
        if data.lab_ids and not await self.repo.labs_exist(data.lab_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="部分实验室不存在")

        staff = LabStaff(
            employee_no=data.employee_no,
            name=data.name,
            phone=data.phone,
            office_location=data.office_location,
            user_id=data.user_id,
        )
        created = await self.repo.create(staff)
        if data.lab_ids:
            await self.repo.set_lab_assignments(created.id, data.lab_ids)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(created.id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def get(self, staff_id: uuid.UUID) -> LabStaffResponse:
        staff = await self.repo.get_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验员不存在")
        return _to_response(staff)

    async def list(
        self, *, page: int = 1, page_size: int = 20, lab_id: uuid.UUID | None = None, keyword: str | None = None
    ) -> LabStaffListResponse:
        items, total = await self.repo.list_staff(
            page=page, page_size=page_size, lab_id=lab_id, keyword=keyword
        )
        return LabStaffListResponse(
            items=[_to_response(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(self, staff_id: uuid.UUID, data: LabStaffUpdate) -> LabStaffResponse:
        staff = await self.repo.get_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验员不存在")

        update_data = data.model_dump(exclude_unset=True)
        lab_ids = update_data.pop("lab_ids", None)
        for field, value in update_data.items():
            setattr(staff, field, value)

        if lab_ids is not None:
            if lab_ids and not await self.repo.labs_exist(lab_ids):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="部分实验室不存在")
            await self.repo.set_lab_assignments(staff_id, lab_ids)

        await self.db.commit()
        refreshed = await self.repo.get_by_id(staff_id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def delete(self, staff_id: uuid.UUID) -> None:
        staff = await self.repo.get_by_id(staff_id)
        if not staff:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验员不存在")
        await self.repo.soft_delete(staff)
        await self.db.commit()
