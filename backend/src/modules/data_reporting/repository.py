import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.data_reporting.models import (
    DataReportSubmission,
    DataReportTemplate,
    ReportSubmissionStatus,
)


class DataReportingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_template(self, template_id: uuid.UUID) -> DataReportTemplate | None:
        result = await self.db.execute(select(DataReportTemplate).where(DataReportTemplate.id == template_id))
        return result.scalar_one_or_none()

    async def get_template_by_code(self, code: str) -> DataReportTemplate | None:
        result = await self.db.execute(select(DataReportTemplate).where(DataReportTemplate.code == code))
        return result.scalar_one_or_none()

    async def list_templates(
        self, *, page: int = 1, page_size: int = 20, keyword: str | None = None
    ) -> tuple[list[DataReportTemplate], int]:
        query = select(DataReportTemplate)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(or_(DataReportTemplate.name.ilike(pattern), DataReportTemplate.code.ilike(pattern)))
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(DataReportTemplate.code).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_template(self, template: DataReportTemplate) -> DataReportTemplate:
        self.db.add(template)
        await self.db.flush()
        await self.db.refresh(template)
        return template

    async def delete_template(self, template: DataReportTemplate) -> None:
        await self.db.delete(template)
        await self.db.flush()

    async def get_submission(self, submission_id: uuid.UUID) -> DataReportSubmission | None:
        result = await self.db.execute(
            select(DataReportSubmission)
            .where(DataReportSubmission.id == submission_id)
            .options(selectinload(DataReportSubmission.template))
        )
        return result.scalar_one_or_none()

    async def list_submissions(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        template_id: uuid.UUID | None = None,
        period: str | None = None,
        status: ReportSubmissionStatus | None = None,
        unit_name: str | None = None,
    ) -> tuple[list[DataReportSubmission], int]:
        query = select(DataReportSubmission).options(selectinload(DataReportSubmission.template))
        if template_id:
            query = query.where(DataReportSubmission.template_id == template_id)
        if period:
            query = query.where(DataReportSubmission.period == period)
        if status:
            query = query.where(DataReportSubmission.status == status)
        if unit_name:
            query = query.where(DataReportSubmission.unit_name.ilike(f"%{unit_name}%"))
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(DataReportSubmission.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_submission(self, submission: DataReportSubmission) -> DataReportSubmission:
        self.db.add(submission)
        await self.db.flush()
        await self.db.refresh(submission)
        return submission

    async def list_all_submissions(self) -> list[DataReportSubmission]:
        result = await self.db.execute(
            select(DataReportSubmission).options(selectinload(DataReportSubmission.template))
        )
        return list(result.scalars().all())
