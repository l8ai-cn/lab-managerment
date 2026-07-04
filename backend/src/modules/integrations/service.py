from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.integrations.adapters import get_adapter
from src.modules.integrations.models import IntegrationConfig, IntegrationSyncLog, IntegrationType, SyncStatus
from src.modules.integrations.repository import IntegrationRepository
from src.modules.integrations.schemas import IntegrationStatusResponse, SyncLogResponse, SyncTriggerResponse


class IntegrationService:
    def __init__(self, db: AsyncSession):
        self.repo = IntegrationRepository(db)
        self.db = db

    async def trigger_sync(self, integration_type: IntegrationType) -> SyncTriggerResponse:
        config_result = await self.db.execute(
            select(IntegrationConfig).where(IntegrationConfig.integration_type == integration_type)
        )
        config = config_result.scalar_one_or_none()
        if config and not config.enabled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="该集成已禁用")

        adapter = get_adapter(integration_type, self.db)
        try:
            result = await adapter.sync()
            sync_status = SyncStatus.SUCCESS if result.success else SyncStatus.FAILED
            log = IntegrationSyncLog(
                integration_type=integration_type,
                status=sync_status,
                synced_count=result.synced_count,
                message=result.message,
            )
            await self.repo.create_log(log)
            if config:
                config.last_synced_at = datetime.now(UTC)
            else:
                self.db.add(
                    IntegrationConfig(
                        integration_type=integration_type,
                        enabled=True,
                        last_synced_at=datetime.now(UTC),
                    )
                )
            await self.db.commit()
            return SyncTriggerResponse(
                integration_type=integration_type,
                status=sync_status,
                synced_count=result.synced_count,
                message=result.message,
            )
        except Exception as exc:
            log = IntegrationSyncLog(
                integration_type=integration_type,
                status=SyncStatus.FAILED,
                synced_count=0,
                message=f"同步失败: {exc}",
            )
            await self.repo.create_log(log)
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"同步失败: {exc}",
            ) from exc

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
                detail=f"无效的集成类型: {type_str}，可选: asset/card/access/face/payment/safety_exam",
            ) from e
