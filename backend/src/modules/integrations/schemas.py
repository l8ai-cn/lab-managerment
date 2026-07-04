import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.modules.integrations.models import IntegrationType, SyncStatus


class SyncLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    integration_type: IntegrationType
    status: SyncStatus
    synced_count: int
    message: str | None
    synced_at: datetime


class SyncTriggerResponse(BaseModel):
    integration_type: IntegrationType
    status: SyncStatus
    synced_count: int
    message: str


class IntegrationStatusResponse(BaseModel):
    integrations: list[dict]
