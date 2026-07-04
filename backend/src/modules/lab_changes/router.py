import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.lab_changes.models import ChangeRequestStatus
from src.modules.lab_changes.schemas import (
    ApprovalActionRequest,
    ChangeRequestCreate,
    ChangeRequestListResponse,
    ChangeRequestResponse,
    ChangeRequestUpdate,
)
from src.modules.lab_changes.service import LabChangeService
from src.modules.users.models import User

router = APIRouter(prefix="/lab-changes", tags=["实验室变更管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> LabChangeService:
    return LabChangeService(db)


@router.get("", response_model=ChangeRequestListResponse)
async def list_change_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    lab_id: uuid.UUID | None = None,
    status: ChangeRequestStatus | None = None,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.list(page=page, page_size=page_size, lab_id=lab_id, status=status)


@router.post("", response_model=ChangeRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_change_request(
    data: ChangeRequestCreate,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.create(data, user)


@router.get("/{request_id}", response_model=ChangeRequestResponse)
async def get_change_request(
    request_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.get(request_id)


@router.patch("/{request_id}", response_model=ChangeRequestResponse)
async def update_change_request(
    request_id: uuid.UUID,
    data: ChangeRequestUpdate,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.update(request_id, data, user)


@router.post("/{request_id}/submit", response_model=ChangeRequestResponse)
async def submit_change_request(
    request_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.submit(request_id, user)


@router.post("/{request_id}/approve", response_model=ChangeRequestResponse)
async def approve_change_request(
    request_id: uuid.UUID,
    body: ApprovalActionRequest = ApprovalActionRequest(),
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.approve(request_id, user, body)


@router.post("/{request_id}/reject", response_model=ChangeRequestResponse)
async def reject_change_request(
    request_id: uuid.UUID,
    body: ApprovalActionRequest,
    user: User = Depends(get_current_user),
    service: LabChangeService = Depends(get_service),
):
    return await service.reject(request_id, user, body)
