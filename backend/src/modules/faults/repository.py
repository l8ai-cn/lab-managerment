import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.faults.models import FaultHandlingRecord, FaultReport, FaultStatus


class FaultRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_report(self, report_id: uuid.UUID) -> FaultReport | None:
        result = await self.db.execute(
            select(FaultReport)
            .where(FaultReport.id == report_id)
            .options(selectinload(FaultReport.lab), selectinload(FaultReport.handling_records))
        )
        return result.scalar_one_or_none()

    async def list_reports(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        lab_id: uuid.UUID | None = None,
        status: FaultStatus | None = None,
        fault_type: str | None = None,
        reporter_id: uuid.UUID | None = None,
        assignee_id: uuid.UUID | None = None,
    ) -> tuple[list[FaultReport], int]:
        query = select(FaultReport).options(selectinload(FaultReport.lab))
        if lab_id:
            query = query.where(FaultReport.lab_id == lab_id)
        if status:
            query = query.where(FaultReport.status == status)
        if fault_type:
            query = query.where(FaultReport.fault_type == fault_type)
        if reporter_id:
            query = query.where(FaultReport.reporter_id == reporter_id)
        if assignee_id:
            query = query.where(FaultReport.assignee_id == assignee_id)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(FaultReport.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_report(self, report: FaultReport) -> FaultReport:
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def add_handling_record(self, record: FaultHandlingRecord) -> FaultHandlingRecord:
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def get_lab_qr_token(self, lab_id: uuid.UUID) -> str | None:
        result = await self.db.execute(
            select(FaultReport.qr_code_token)
            .where(FaultReport.lab_id == lab_id, FaultReport.qr_code_token.isnot(None))
            .order_by(FaultReport.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def stats(self) -> tuple[list[FaultReport], int]:
        result = await self.db.execute(select(FaultReport).options(selectinload(FaultReport.lab)))
        reports = list(result.scalars().all())
        return reports, len(reports)
