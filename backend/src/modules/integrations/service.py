import random

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.integrations.models import IntegrationSyncLog, IntegrationType, SyncStatus
from src.modules.integrations.repository import IntegrationRepository
from src.modules.integrations.schemas import IntegrationStatusResponse, SyncLogResponse, SyncTriggerResponse

MOCK_COUNTS = {
    IntegrationType.ASSET: (10, 50),
    IntegrationType.CARD: (5, 30),
    IntegrationType.ACCESS: (3, 20),
    IntegrationType.FACE: (2, 15),
    IntegrationType.PAYMENT: (1, 10),
}


class IntegrationService:
    def __init__(self, db: AsyncSession):
        self.repo = IntegrationRepository(db)
        self.db = db

    async def trigger_sync(self, integration_type: IntegrationType) -> SyncTriggerResponse:
        low, high = MOCK_COUNTS.get(integration_type, (1, 10))
        count = random.randint(low, high)
        success = random.random() > 0.1
        sync_status = SyncStatus.SUCCESS if success else SyncStatus.FAILED
        message = f"Mock sync completed: {count} records" if success else "Mock sync failed: connection timeout"
        log = IntegrationSyncLog(
            integration_type=integration_type,
            status=sync_status,
            synced_count=count if success else 0,
            message=message,
        )
        await self.repo.create_log(log)
        await self.db.commit()
        return SyncTriggerResponse(
            integration_type=integration_type,
            status=sync_status,
            synced_count=count if success else 0,
            message=message,
        )

    async def get_status(self) -> IntegrationStatusResponse:
        logs = await self.repo.list_latest_all()
        integrations = [
            {
                "type": log.integration_type.value,
                "status": log.status.value,
                "synced_count": log.synced_count,
                "last_synced_at": log.synced_at.isoformat(),
                "message": log.message,
            }
            for log in logs
        ]
        for itype in IntegrationType:
            if not any(i["type"] == itype.value for i in integrations):
                integrations.append({
                    "type": itype.value,
                    "status": "never_synced",
                    "synced_count": 0,
                    "last_synced_at": None,
                    "message": None,
                })
        return IntegrationStatusResponse(integrations=integrations)

    @staticmethod
    def parse_type(type_str: str) -> IntegrationType:
        try:
            return IntegrationType(type_str)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的集成类型: {type_str}，可选: asset/card/access/face/payment",
            ) from e
