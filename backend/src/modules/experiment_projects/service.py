import io
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.experiment_projects.models import Course, ExperimentProject
from src.modules.experiment_projects.repository import ExperimentProjectRepository
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


def _course_response(c: Course) -> CourseResponse:
    return CourseResponse.model_validate(c)


def _project_response(p: ExperimentProject) -> ExperimentProjectResponse:
    return ExperimentProjectResponse(
        id=p.id,
        course_id=p.course_id,
        course_name=p.course.name if p.course else None,
        course_code=p.course.code if p.course else None,
        name=p.name,
        type=p.type,
        hours=p.hours,
        instruments_needed=p.instruments_needed,
        consumables=p.consumables,
        majors=p.majors,
        semester=p.semester,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


class ExperimentProjectService:
    def __init__(self, db: AsyncSession):
        self.repo = ExperimentProjectRepository(db)
        self.db = db

    async def create_course(self, data: CourseCreate) -> CourseResponse:
        if await self.repo.get_course_by_code(data.code):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="课程代码已存在")
        course = Course(**data.model_dump())
        created = await self.repo.create_course(course)
        await self.db.commit()
        return _course_response(created)

    async def get_course(self, course_id: uuid.UUID) -> CourseResponse:
        course = await self.repo.get_course(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在")
        return _course_response(course)

    async def list_courses(self, **kwargs) -> CourseListResponse:
        items, total = await self.repo.list_courses(**kwargs)
        return CourseListResponse(
            items=[_course_response(c) for c in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )

    async def update_course(self, course_id: uuid.UUID, data: CourseUpdate) -> CourseResponse:
        course = await self.repo.get_course(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在")
        if data.code and data.code != course.code:
            if await self.repo.get_course_by_code(data.code):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="课程代码已存在")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(course, k, v)
        await self.db.commit()
        await self.db.refresh(course)
        return _course_response(course)

    async def delete_course(self, course_id: uuid.UUID) -> None:
        course = await self.repo.get_course(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在")
        await self.repo.delete_course(course)
        await self.db.commit()

    async def create_project(self, data: ExperimentProjectCreate) -> ExperimentProjectResponse:
        course = await self.repo.get_course(data.course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在")
        project = ExperimentProject(**data.model_dump())
        created = await self.repo.create_project(project)
        await self.db.commit()
        refreshed = await self.repo.get_project(created.id)
        return _project_response(refreshed)  # type: ignore[arg-type]

    async def get_project(self, project_id: uuid.UUID) -> ExperimentProjectResponse:
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验项目不存在")
        return _project_response(project)

    async def list_projects(self, **kwargs) -> ExperimentProjectListResponse:
        items, total = await self.repo.list_projects(**kwargs)
        return ExperimentProjectListResponse(
            items=[_project_response(p) for p in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )

    async def update_project(
        self, project_id: uuid.UUID, data: ExperimentProjectUpdate
    ) -> ExperimentProjectResponse:
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验项目不存在")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(project, k, v)
        await self.db.commit()
        refreshed = await self.repo.get_project(project_id)
        return _project_response(refreshed)  # type: ignore[arg-type]

    async def delete_project(self, project_id: uuid.UUID) -> None:
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验项目不存在")
        await self.repo.delete_project(project)
        await self.db.commit()

    async def batch_copy(self, data: BatchCopyRequest) -> BatchCopyResult:
        source = await self.repo.get_course(data.source_course_id)
        target = await self.repo.get_course(data.target_course_id)
        if not source or not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="课程不存在")
        projects = await self.repo.list_projects_by_course(data.source_course_id)
        if data.project_ids:
            projects = [p for p in projects if p.id in data.project_ids]
        count = 0
        for p in projects:
            copy = ExperimentProject(
                course_id=data.target_course_id,
                name=p.name,
                type=p.type,
                hours=p.hours,
                instruments_needed=p.instruments_needed,
                consumables=p.consumables,
                majors=p.majors,
                semester=p.semester,
            )
            await self.repo.create_project(copy)
            count += 1
        await self.db.commit()
        return BatchCopyResult(copied_count=count)

    async def export_excel(
        self, course_id: uuid.UUID | None = None, semester: str | None = None
    ) -> bytes:
        try:
            import openpyxl
        except ImportError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="openpyxl 未安装"
            ) from e

        projects = await self.repo.list_all_for_export(course_id=course_id, semester=semester)
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "实验项目"
        ws.append(["课程代码", "课程名称", "项目名称", "类型", "学时", "学期", "所需仪器", "耗材", "适用专业"])
        for p in projects:
            ws.append([
                p.course.code if p.course else "",
                p.course.name if p.course else "",
                p.name,
                p.type.value,
                p.hours or "",
                p.semester or "",
                str(p.instruments_needed or []),
                str(p.consumables or []),
                str(p.majors or []),
            ])
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()
