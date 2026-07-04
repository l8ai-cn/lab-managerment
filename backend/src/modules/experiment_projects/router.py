import uuid

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.experiment_projects.models import ProjectType
from src.modules.experiment_projects.schemas import (
    BatchCopyRequest,
    BatchCopyResult,
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
    ExperimentProjectCreate,
    ExperimentProjectListResponse,
    ExperimentProjectResponse,
    ExperimentProjectUpdate,
)
from src.modules.experiment_projects.service import ExperimentProjectService
from src.modules.users.models import User

router = APIRouter(prefix="/experiment-projects", tags=["实验项目"])


def get_service(db: AsyncSession = Depends(get_db)) -> ExperimentProjectService:
    return ExperimentProjectService(db)


courses_router = APIRouter(prefix="/courses", tags=["课程管理"])


@courses_router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    department: str | None = None,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.list_courses(page=page, page_size=page_size, keyword=keyword, department=department)


@courses_router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.create_course(data)


@courses_router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.get_course(course_id)


@courses_router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    data: CourseUpdate,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.update_course(course_id, data)


@courses_router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    await service.delete_course(course_id)


@router.get("", response_model=ExperimentProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    course_id: uuid.UUID | None = None,
    project_type: ProjectType | None = None,
    semester: str | None = None,
    keyword: str | None = None,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.list_projects(
        page=page,
        page_size=page_size,
        course_id=course_id,
        project_type=project_type,
        semester=semester,
        keyword=keyword,
    )


@router.post("", response_model=ExperimentProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ExperimentProjectCreate,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.create_project(data)


@router.get("/export")
async def export_projects(
    course_id: uuid.UUID | None = None,
    semester: str | None = None,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    content = await service.export_excel(course_id=course_id, semester=semester)
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=experiment_projects.xlsx"},
    )


@router.post("/batch-copy", response_model=BatchCopyResult)
async def batch_copy(
    data: BatchCopyRequest,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.batch_copy(data)


@router.get("/{project_id}", response_model=ExperimentProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ExperimentProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ExperimentProjectUpdate,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    return await service.update_project(project_id, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: ExperimentProjectService = Depends(get_service),
):
    await service.delete_project(project_id)
