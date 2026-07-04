import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.experiment_projects.models import Course, ExperimentProject, ProjectType


class ExperimentProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_course(self, course_id: uuid.UUID) -> Course | None:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def get_course_by_code(self, code: str) -> Course | None:
        result = await self.db.execute(select(Course).where(Course.code == code))
        return result.scalar_one_or_none()

    async def list_courses(
        self, *, page: int = 1, page_size: int = 20, keyword: str | None = None, department: str | None = None
    ) -> tuple[list[Course], int]:
        query = select(Course)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(or_(Course.name.ilike(pattern), Course.code.ilike(pattern)))
        if department:
            query = query.where(Course.department == department)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(Course.code).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_course(self, course: Course) -> Course:
        self.db.add(course)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def delete_course(self, course: Course) -> None:
        await self.db.delete(course)
        await self.db.flush()

    async def get_project(self, project_id: uuid.UUID) -> ExperimentProject | None:
        result = await self.db.execute(
            select(ExperimentProject)
            .where(ExperimentProject.id == project_id)
            .options(selectinload(ExperimentProject.course))
        )
        return result.scalar_one_or_none()

    async def list_projects(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        course_id: uuid.UUID | None = None,
        project_type: ProjectType | None = None,
        semester: str | None = None,
        keyword: str | None = None,
    ) -> tuple[list[ExperimentProject], int]:
        query = select(ExperimentProject).options(selectinload(ExperimentProject.course))
        if course_id:
            query = query.where(ExperimentProject.course_id == course_id)
        if project_type:
            query = query.where(ExperimentProject.type == project_type)
        if semester:
            query = query.where(ExperimentProject.semester == semester)
        if keyword:
            query = query.where(ExperimentProject.name.ilike(f"%{keyword}%"))
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(ExperimentProject.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def list_projects_by_course(self, course_id: uuid.UUID) -> list[ExperimentProject]:
        result = await self.db.execute(
            select(ExperimentProject).where(ExperimentProject.course_id == course_id)
        )
        return list(result.scalars().all())

    async def create_project(self, project: ExperimentProject) -> ExperimentProject:
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project: ExperimentProject) -> None:
        await self.db.delete(project)
        await self.db.flush()

    async def list_all_for_export(
        self, course_id: uuid.UUID | None = None, semester: str | None = None
    ) -> list[ExperimentProject]:
        query = select(ExperimentProject).options(selectinload(ExperimentProject.course))
        if course_id:
            query = query.where(ExperimentProject.course_id == course_id)
        if semester:
            query = query.where(ExperimentProject.semester == semester)
        result = await self.db.execute(query.order_by(ExperimentProject.course_id, ExperimentProject.name))
        return list(result.scalars().all())
