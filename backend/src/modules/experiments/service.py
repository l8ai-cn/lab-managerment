import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.experiments.models import STATUS_TRANSITIONS, Experiment, ExperimentStatus
from src.modules.experiments.repository import ExperimentRepository
from src.modules.experiments.schemas import (
    ExperimentCreate,
    ExperimentListResponse,
    ExperimentResponse,
    ExperimentUpdate,
    StatusTransitionResponse,
)


class ExperimentService:
    def __init__(self, db: AsyncSession):
        self.repo = ExperimentRepository(db)
        self.db = db

    async def _generate_code(self) -> str:
        year = datetime.now(UTC).year
        seq = await self.repo.get_max_code_seq(year) + 1
        return f"EXP-{year}-{seq:04d}"

    async def create(self, data: ExperimentCreate) -> ExperimentResponse:
        experiment = Experiment(
            code=await self._generate_code(),
            title=data.title,
            description=data.description,
            hypothesis=data.hypothesis,
            owner_id=data.owner_id,
            protocol_id=data.protocol_id,
            project_id=data.project_id,
            metadata_=data.metadata or {},
            planned_start=data.planned_start,
            planned_end=data.planned_end,
        )
        created = await self.repo.create(experiment)
        await self.db.commit()
        return ExperimentResponse.model_validate(created)

    async def get(self, experiment_id: uuid.UUID) -> ExperimentResponse:
        experiment = await self.repo.get_by_id(experiment_id)
        if not experiment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验不存在")
        return ExperimentResponse.model_validate(experiment)

    async def list(
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
    ) -> ExperimentListResponse:
        items, total = await self.repo.list_experiments(
            page=page,
            page_size=page_size,
            status=status,
            owner_id=owner_id,
            project_id=project_id,
            keyword=keyword,
            planned_start_from=planned_start_from,
            planned_start_to=planned_start_to,
        )
        return ExperimentListResponse(
            items=[ExperimentResponse.model_validate(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(self, experiment_id: uuid.UUID, data: ExperimentUpdate) -> ExperimentResponse:
        experiment = await self.repo.get_by_id(experiment_id)
        if not experiment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验不存在")

        if experiment.status not in (ExperimentStatus.DRAFT, ExperimentStatus.PLANNED):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="仅草稿或已计划状态的实验可编辑",
            )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "metadata":
                setattr(experiment, "metadata_", value)
            else:
                setattr(experiment, field, value)

        updated = await self.repo.update(experiment)
        await self.db.commit()
        return ExperimentResponse.model_validate(updated)

    async def delete(self, experiment_id: uuid.UUID) -> None:
        experiment = await self.repo.get_by_id(experiment_id)
        if not experiment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验不存在")

        if experiment.status != ExperimentStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="仅草稿状态的实验可删除",
            )

        await self.repo.soft_delete(experiment)
        await self.db.commit()

    async def transition(
        self,
        experiment_id: uuid.UUID,
        target_status: ExperimentStatus,
        *,
        reason: str | None = None,
    ) -> StatusTransitionResponse:
        experiment = await self.repo.get_by_id(experiment_id)
        if not experiment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验不存在")

        allowed = STATUS_TRANSITIONS.get(experiment.status, set())
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"不允许从 {experiment.status.value} 转换到 {target_status.value}",
            )

        if target_status == ExperimentStatus.PLANNED and not experiment.planned_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="提交计划前须设置计划开始时间",
            )

        now = datetime.now(UTC)
        if target_status == ExperimentStatus.IN_PROGRESS:
            experiment.actual_start = now
        elif target_status in (ExperimentStatus.COMPLETED, ExperimentStatus.FAILED):
            experiment.actual_end = now

        experiment.status = target_status
        await self.repo.update(experiment)
        await self.db.commit()

        return StatusTransitionResponse(
            id=experiment.id,
            status=target_status,
            message=f"实验状态已更新为 {target_status.value}",
        )
