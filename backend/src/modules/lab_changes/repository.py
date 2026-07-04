import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.lab_changes.models import ChangeRequestStatus, LabChangeApprovalRecord, LabChangeRequest


class LabChangeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self):
        return select(LabChangeRequest).options(
            selectinload(LabChangeRequest.approval_records).selectinload(
                LabChangeApprovalRecord.approver
            ),
            selectinload(LabChangeRequest.lab),
            selectinload(LabChangeRequest.applicant),
        )

    async def get_by_id(self, request_id: uuid.UUID) -> LabChangeRequest | None:
        result = await self.db.execute(self._base_query().where(LabChangeRequest.id == request_id))
        return result.scalar_one_or_none()

    async def list_requests(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        lab_id: uuid.UUID | None = None,
        status: ChangeRequestStatus | None = None,
        applicant_id: uuid.UUID | None = None,
    ) -> tuple[list[LabChangeRequest], int]:
        query = self._base_query()
        if lab_id:
            query = query.where(LabChangeRequest.lab_id == lab_id)
        if status:
            query = query.where(LabChangeRequest.status == status)
        if applicant_id:
            query = query.where(LabChangeRequest.applicant_id == applicant_id)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()
        query = (
            query.order_by(LabChangeRequest.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().unique().all()), total

    async def create(self, request: LabChangeRequest) -> LabChangeRequest:
        self.db.add(request)
        await self.db.flush()
        await self.db.refresh(request)
        return request

    async def add_approval_record(self, record: LabChangeApprovalRecord) -> None:
        self.db.add(record)
        await self.db.flush()

    async def update(self, request: LabChangeRequest) -> LabChangeRequest:
        await self.db.flush()
        await self.db.refresh(request)
        return request
