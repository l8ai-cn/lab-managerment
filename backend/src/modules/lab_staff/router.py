import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import require_roles
from src.modules.lab_staff.schemas import (
    LabStaffCreate,
    LabStaffListResponse,
    LabStaffResponse,
    LabStaffUpdate,
)
from src.modules.lab_staff.service import LabStaffService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/lab-staff", tags=["实验员管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> LabStaffService:
    return LabStaffService(db)


@router.get("", response_model=LabStaffListResponse)
async def list_lab_staff(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    lab_id: uuid.UUID | None = None,
    keyword: str | None = None,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.DEPT_ADMIN)),
    service: LabStaffService = Depends(get_service),
):
    return await service.list(page=page, page_size=page_size, lab_id=lab_id, keyword=keyword)


@router.post("", response_model=LabStaffResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_staff(
    data: LabStaffCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: LabStaffService = Depends(get_service),
):
    return await service.create(data)


@router.get("/{staff_id}", response_model=LabStaffResponse)
async def get_lab_staff(
    staff_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.DEPT_ADMIN)),
    service: LabStaffService = Depends(get_service),
):
    return await service.get(staff_id)


@router.patch("/{staff_id}", response_model=LabStaffResponse)
async def update_lab_staff(
    staff_id: uuid.UUID,
    data: LabStaffUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: LabStaffService = Depends(get_service),
):
    return await service.update(staff_id, data)


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_staff(
    staff_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: LabStaffService = Depends(get_service),
):
    await service.delete(staff_id)
