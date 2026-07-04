import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.integrations.models import IntegrationSyncLog, IntegrationType, SyncStatus


class IntegrationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_log(self, log: IntegrationSyncLog) -> IntegrationSyncLog:
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return log

    async def get_latest_by_type(self, integration_type: IntegrationType) -> IntegrationSyncLog | None:
        result = await self.db.execute(
            select(IntegrationSyncLog)
            .where(IntegrationSyncLog.integration_type == integration_type)
            .order_by(IntegrationSyncLog.synced_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_latest_all(self) -> list[IntegrationSyncLog]:
        logs: list[IntegrationSyncLog] = []
        for itype in IntegrationType:
            log = await self.get_latest_by_type(itype)
            if log:
                logs.append(log)
        return logs
