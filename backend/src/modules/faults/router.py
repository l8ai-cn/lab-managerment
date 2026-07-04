import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.faults.models import FaultStatus
from src.modules.faults.schemas import (
    AssignRequest,
    FaultQrResponse,
    FaultReportCreate,
    FaultReportListResponse,
    FaultReportResponse,
    FaultReportUpdate,
    FaultStatsResponse,
    HandleRequest,
    HandlingRecordResponse,
    StatusUpdateRequest,
)
from src.modules.faults.service import FaultService
from src.modules.users.models import User, UserRole
from src.shared.file_storage import save_upload

router = APIRouter(prefix="/faults", tags=["故障报修"])
lab_qr_router = APIRouter(tags=["故障报修"])


def get_service(db: AsyncSession = Depends(get_db)) -> FaultService:
    return FaultService(db)


@router.get("", response_model=FaultReportListResponse)
async def list_faults(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    lab_id: uuid.UUID | None = None,
    status: FaultStatus | None = None,
    fault_type: str | None = None,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.list(page=page, page_size=page_size, lab_id=lab_id, status=status, fault_type=fault_type)


@router.post("", response_model=FaultReportResponse, status_code=status.HTTP_201_CREATED)
async def create_fault(
    data: FaultReportCreate,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.create(data, user)


@router.get("/stats", response_model=FaultStatsResponse)
async def fault_stats(
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.stats()


@router.get("/{report_id}", response_model=FaultReportResponse)
async def get_fault(
    report_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.get(report_id)


@router.patch("/{report_id}", response_model=FaultReportResponse)
async def update_fault(
    report_id: uuid.UUID,
    data: FaultReportUpdate,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.update(report_id, data)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fault(
    report_id: uuid.UUID,
    user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: FaultService = Depends(get_service),
):
    await service.delete(report_id)


@router.post("/{report_id}/attachments", response_model=FaultReportResponse)
async def upload_attachment(
    report_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    url = await save_upload(file, subdir="faults")
    return await service.add_attachment(report_id, url)


@router.post("/{report_id}/assign", response_model=FaultReportResponse)
async def assign_fault(
    report_id: uuid.UUID,
    data: AssignRequest,
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: FaultService = Depends(get_service),
):
    return await service.assign(report_id, data, user)


@router.post("/{report_id}/status", response_model=FaultReportResponse)
async def update_fault_status(
    report_id: uuid.UUID,
    data: StatusUpdateRequest,
    user: User = Depends(require_roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)),
    service: FaultService = Depends(get_service),
):
    return await service.update_status(report_id, data, user)


@router.post("/{report_id}/handle", response_model=HandlingRecordResponse)
async def handle_fault(
    report_id: uuid.UUID,
    data: HandleRequest,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.handle(report_id, data, user)


@lab_qr_router.get("/labs/{lab_id}/fault-qr", response_model=FaultQrResponse)
async def get_lab_fault_qr(
    lab_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: FaultService = Depends(get_service),
):
    return await service.get_lab_fault_qr(lab_id)
