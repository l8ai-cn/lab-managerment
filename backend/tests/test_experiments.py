import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.experiments.models import Experiment, ExperimentStatus, STATUS_TRANSITIONS
from src.modules.experiments.schemas import ExperimentCreate
from src.modules.experiments.service import ExperimentService


def test_status_transitions_cover_all_statuses():
    for status in ExperimentStatus:
        assert status in STATUS_TRANSITIONS


def test_draft_can_submit_or_cancel():
    allowed = STATUS_TRANSITIONS[ExperimentStatus.DRAFT]
    assert ExperimentStatus.PLANNED in allowed
    assert ExperimentStatus.CANCELLED in allowed


def test_archived_is_terminal():
    assert STATUS_TRANSITIONS[ExperimentStatus.ARCHIVED] == set()


@pytest.mark.asyncio
async def test_create_experiment_generates_code():
    db = AsyncMock()
    service = ExperimentService(db)
    service.repo.get_max_code_seq = AsyncMock(return_value=5)

    experiment = Experiment(
        id=uuid.uuid4(),
        code="EXP-2026-0006",
        title="测试实验",
        status=ExperimentStatus.DRAFT,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    service.repo.create = AsyncMock(return_value=experiment)

    result = await service.create(ExperimentCreate(title="测试实验"))
    assert result.title == "测试实验"
    assert result.status == ExperimentStatus.DRAFT
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_transition_rejects_invalid():
    db = AsyncMock()
    service = ExperimentService(db)

    experiment = MagicMock()
    experiment.id = uuid.uuid4()
    experiment.status = ExperimentStatus.DRAFT
    experiment.planned_start = datetime.now(UTC)
    service.repo.get_by_id = AsyncMock(return_value=experiment)

    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await service.transition(experiment.id, ExperimentStatus.COMPLETED)
    assert exc_info.value.status_code == 409
