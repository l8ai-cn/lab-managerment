"""实验管理业务服务层。

封装所有与实验相关的业务规则,保持 API 层的轻量。
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import ExperimentStatus, can_transition
from app.models.experiment import Experiment, ExperimentRecord
from app.exceptions import (
    ConflictError,
    InvalidStateTransitionError,
    NotFoundError,
)
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentRecordCreate,
    ExperimentUpdate,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExperimentService:
    """实验管理相关业务操作。"""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------
    def get(self, experiment_id: int) -> Experiment:
        experiment = self.db.get(Experiment, experiment_id)
        if experiment is None:
            raise NotFoundError(f"实验 id={experiment_id} 不存在")
        return experiment

    def list(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        status: ExperimentStatus | None = None,
        owner: str | None = None,
        keyword: str | None = None,
    ) -> tuple[list[Experiment], int]:
        """分页查询实验,支持按状态 / 负责人 / 关键字过滤。

        返回 ``(items, total)``。
        """

        filters = []
        if status is not None:
            filters.append(Experiment.status == status)
        if owner:
            filters.append(Experiment.owner == owner)
        if keyword:
            like = f"%{keyword}%"
            filters.append(
                or_(
                    Experiment.title.ilike(like),
                    Experiment.code.ilike(like),
                    Experiment.description.ilike(like),
                )
            )

        base_stmt = select(Experiment)
        if filters:
            base_stmt = base_stmt.where(*filters)

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        stmt = (
            base_stmt.order_by(Experiment.created_at.desc(), Experiment.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    # ------------------------------------------------------------------
    # 变更
    # ------------------------------------------------------------------
    def create(self, payload: ExperimentCreate) -> Experiment:
        code = payload.code or self._generate_code()
        if self._code_exists(code):
            raise ConflictError(f"实验编号 {code} 已存在")

        experiment = Experiment(
            code=code,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            owner=payload.owner,
            lab_location=payload.lab_location,
            tags=payload.tags,
            planned_start_at=payload.planned_start_at,
            planned_end_at=payload.planned_end_at,
            status=ExperimentStatus.DRAFT,
        )
        self.db.add(experiment)
        self.db.commit()
        self.db.refresh(experiment)
        return experiment

    def update(self, experiment_id: int, payload: ExperimentUpdate) -> Experiment:
        experiment = self.get(experiment_id)

        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(experiment, field, value)

        # 更新后校验计划时间窗口。
        start = experiment.planned_start_at
        end = experiment.planned_end_at
        if start is not None and end is not None and end < start:
            raise ConflictError("计划结束时间不能早于计划开始时间")

        self.db.commit()
        self.db.refresh(experiment)
        return experiment

    def change_status(
        self, experiment_id: int, target: ExperimentStatus
    ) -> Experiment:
        experiment = self.get(experiment_id)
        current = experiment.status

        if not can_transition(current, target):
            raise InvalidStateTransitionError(
                f"实验状态无法从 {current.value} 流转到 {target.value}"
            )

        # 状态流转时维护实际开始 / 结束时间。
        if (
            target == ExperimentStatus.IN_PROGRESS
            and experiment.actual_start_at is None
        ):
            experiment.actual_start_at = _utcnow()
        if target == ExperimentStatus.COMPLETED:
            experiment.actual_end_at = _utcnow()

        experiment.status = target
        self.db.commit()
        self.db.refresh(experiment)
        return experiment

    def delete(self, experiment_id: int) -> None:
        experiment = self.get(experiment_id)
        self.db.delete(experiment)
        self.db.commit()

    # ------------------------------------------------------------------
    # 实验记录
    # ------------------------------------------------------------------
    def add_record(
        self, experiment_id: int, payload: ExperimentRecordCreate
    ) -> ExperimentRecord:
        experiment = self.get(experiment_id)
        record = ExperimentRecord(
            experiment_id=experiment.id,
            record_type=payload.record_type,
            content=payload.content,
            recorded_by=payload.recorded_by,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def list_records(self, experiment_id: int) -> list[ExperimentRecord]:
        experiment = self.get(experiment_id)
        return list(experiment.records)

    # ------------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------------
    def _code_exists(self, code: str) -> bool:
        stmt = select(Experiment.id).where(Experiment.code == code)
        return self.db.execute(stmt).first() is not None

    def _generate_code(self) -> str:
        """生成形如 ``EXP-YYYYMMDD-0001`` 的实验编号。"""

        today = _utcnow().strftime("%Y%m%d")
        prefix = f"EXP-{today}-"
        stmt = select(func.count()).where(Experiment.code.like(f"{prefix}%"))
        count_today = self.db.execute(stmt).scalar_one()
        # 处理并发 / 已删除导致的编号冲突,循环递增直到唯一。
        seq = count_today + 1
        while True:
            code = f"{prefix}{seq:04d}"
            if not self._code_exists(code):
                return code
            seq += 1
