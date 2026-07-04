from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.integrations.schemas import IntegrationStatusResponse, SyncTriggerResponse
from src.modules.integrations.service import IntegrationService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/integrations", tags=["系统集成"])


def get_service(db: AsyncSession = Depends(get_db)) -> IntegrationService:
    return IntegrationService(db)


@router.post("/sync/{integration_type}", response_model=SyncTriggerResponse)
async def trigger_sync(
    integration_type: str,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
    service: IntegrationService = Depends(get_service),
):
    itype = service.parse_type(integration_type)
    return await service.trigger_sync(itype)


@router.get("/status", response_model=IntegrationStatusResponse)
async def integration_status(
    user: User = Depends(get_current_user),
    service: IntegrationService = Depends(get_service),
):
    return await service.get_status()
