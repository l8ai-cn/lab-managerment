"""API 层依赖。"""

from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService


def get_experiment_service(
    db: Session = Depends(get_db),
) -> ExperimentService:
    return ExperimentService(db)
