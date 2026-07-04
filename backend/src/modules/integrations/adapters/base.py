from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings


@dataclass
class SyncResult:
    synced_count: int
    message: str
    success: bool = True


class BaseAdapter(ABC):
    integration_type: str
    data_file: str

    def __init__(self, db: AsyncSession):
        self.db = db

    def load_data(self) -> list[dict]:
        path = settings.integrations_data_dir / self.data_file
        if not path.exists():
            return []
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else data.get("records", [])

    @abstractmethod
    async def sync(self) -> SyncResult:
        pass
