import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.experiments.models import ExperimentStatus
from src.modules.experiments.schemas import (
    ExperimentCreate,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentUpdate,
    StatusTransitionRequest,
    StatusTransitionResponse,
)
from src.modules.experiments.service import ExperimentService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/experiments", tags=["实验管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> ExperimentService:
    return ExperimentService(db)


@router.get("", response_model=ExperimentListResponse)
async def list_experiments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: list[ExperimentStatus] | None = Query(None),
    owner_id: uuid.UUID | None = None,
    project_id: uuid.UUID | None = None,
    keyword: str | None = None,
    planned_start_from: datetime | None = None,
    planned_start_to: datetime | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await service.list(
        page=page,
        page_size=page_size,
        status=status,
        owner_id=owner_id,
        project_id=project_id,
        keyword=keyword,
        planned_start_from=planned_start_from,
        planned_start_to=planned_start_to,
    )


@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    data: ExperimentCreate,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await service.create(data)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await service.get(experiment_id)


@router.patch("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: uuid.UUID,
    data: ExperimentUpdate,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await service.update(experiment_id, data)


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.TEACHER)),
    service: ExperimentService = Depends(get_service),
):
    await service.delete(experiment_id)


async def _transition(
    experiment_id: uuid.UUID,
    target: ExperimentStatus,
    body: StatusTransitionRequest | None,
    service: ExperimentService,
) -> StatusTransitionResponse:
    return await service.transition(
        experiment_id,
        target,
        reason=body.reason if body else None,
    )


@router.post("/{experiment_id}/submit", response_model=StatusTransitionResponse)
async def submit_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.PLANNED, body, service)


@router.post("/{experiment_id}/start", response_model=StatusTransitionResponse)
async def start_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.IN_PROGRESS, body, service)


@router.post("/{experiment_id}/pause", response_model=StatusTransitionResponse)
async def pause_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.PAUSED, body, service)


@router.post("/{experiment_id}/resume", response_model=StatusTransitionResponse)
async def resume_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.IN_PROGRESS, body, service)


@router.post("/{experiment_id}/complete", response_model=StatusTransitionResponse)
async def complete_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.COMPLETED, body, service)


@router.post("/{experiment_id}/fail", response_model=StatusTransitionResponse)
async def fail_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.FAILED, body, service)


@router.post("/{experiment_id}/cancel", response_model=StatusTransitionResponse)
async def cancel_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.CANCELLED, body, service)


@router.post("/{experiment_id}/archive", response_model=StatusTransitionResponse)
async def archive_experiment(
    experiment_id: uuid.UUID,
    body: StatusTransitionRequest | None = None,
    _: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_service),
):
    return await _transition(experiment_id, ExperimentStatus.ARCHIVED, body, service)
