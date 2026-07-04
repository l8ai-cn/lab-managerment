import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.data_reporting.models import ReportSubmissionStatus
from src.modules.data_reporting.schemas import (
    AggregateStatsResponse,
    SubmissionCreate,
    SubmissionListResponse,
    SubmissionResponse,
    SubmissionUpdate,
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
)
from src.modules.data_reporting.service import DataReportingService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/data-reporting", tags=["数据报送"])


def get_service(db: AsyncSession = Depends(get_db)) -> DataReportingService:
    return DataReportingService(db)


@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.list_templates(page=page, page_size=page_size, keyword=keyword)


@router.post("/templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: DataReportingService = Depends(get_service),
):
    return await service.create_template(data)


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.get_template(template_id)


@router.patch("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    data: TemplateUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: DataReportingService = Depends(get_service),
):
    return await service.update_template(template_id, data)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
    service: DataReportingService = Depends(get_service),
):
    await service.delete_template(template_id)


@router.get("/submissions", response_model=SubmissionListResponse)
async def list_submissions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    template_id: uuid.UUID | None = None,
    period: str | None = None,
    status: ReportSubmissionStatus | None = None,
    unit_name: str | None = None,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.list_submissions(
        page=page,
        page_size=page_size,
        template_id=template_id,
        period=period,
        status=status,
        unit_name=unit_name,
    )


@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    data: SubmissionCreate,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.create_submission(data)


@router.get("/submissions/stats", response_model=AggregateStatsResponse)
async def submission_stats(
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.aggregate_stats()


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.get_submission(submission_id)


@router.patch("/submissions/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: uuid.UUID,
    data: SubmissionUpdate,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.update_submission(submission_id, data)


@router.post("/submissions/{submission_id}/submit", response_model=SubmissionResponse)
async def submit_report(
    submission_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: DataReportingService = Depends(get_service),
):
    return await service.submit(submission_id)


@router.post("/submissions/{submission_id}/approve", response_model=SubmissionResponse)
async def approve_report(
    submission_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: DataReportingService = Depends(get_service),
):
    return await service.approve(submission_id)
