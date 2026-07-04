import uuid
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.experiments.models import Experiment, ExperimentStatus


class ExperimentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, experiment_id: uuid.UUID) -> Experiment | None:
        result = await self.db.execute(
            select(Experiment).where(
                Experiment.id == experiment_id,
                Experiment.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_experiments(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        status: list[ExperimentStatus] | None = None,
        owner_id: uuid.UUID | None = None,
        project_id: uuid.UUID | None = None,
        keyword: str | None = None,
        planned_start_from: datetime | None = None,
        planned_start_to: datetime | None = None,
    ) -> tuple[list[Experiment], int]:
        query = select(Experiment).where(Experiment.deleted_at.is_(None))

        if status:
            query = query.where(Experiment.status.in_(status))
        if owner_id:
            query = query.where(Experiment.owner_id == owner_id)
        if project_id:
            query = query.where(Experiment.project_id == project_id)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(or_(Experiment.title.ilike(pattern), Experiment.code.ilike(pattern)))
        if planned_start_from:
            query = query.where(Experiment.planned_start >= planned_start_from)
        if planned_start_to:
            query = query.where(Experiment.planned_start <= planned_start_to)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = (
            query.order_by(Experiment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, experiment: Experiment) -> Experiment:
        self.db.add(experiment)
        await self.db.flush()
        await self.db.refresh(experiment)
        return experiment

    async def update(self, experiment: Experiment) -> Experiment:
        await self.db.flush()
        await self.db.refresh(experiment)
        return experiment

    async def soft_delete(self, experiment: Experiment) -> None:
        experiment.deleted_at = datetime.now(tz=datetime.now().astimezone().tzinfo)
        await self.db.flush()

    async def get_max_code_seq(self, year: int) -> int:
        prefix = f"EXP-{year}-"
        result = await self.db.execute(
            select(Experiment.code)
            .where(Experiment.code.like(f"{prefix}%"))
            .order_by(Experiment.code.desc())
            .limit(1)
        )
        last_code = result.scalar_one_or_none()
        if not last_code:
            return 0
        return int(last_code.split("-")[-1])
