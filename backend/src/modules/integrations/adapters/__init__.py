from src.modules.integrations.adapters.access import AccessAdapter
from src.modules.integrations.adapters.asset import AssetAdapter
from src.modules.integrations.adapters.base import BaseAdapter
from src.modules.integrations.adapters.card import CardAdapter
from src.modules.integrations.adapters.face import FaceAdapter
from src.modules.integrations.adapters.payment import PaymentAdapter
from src.modules.integrations.adapters.safety_exam import SafetyExamAdapter
from src.modules.integrations.models import IntegrationType

ADAPTER_MAP: dict[IntegrationType, type[BaseAdapter]] = {
    IntegrationType.ASSET: AssetAdapter,
    IntegrationType.CARD: CardAdapter,
    IntegrationType.ACCESS: AccessAdapter,
    IntegrationType.FACE: FaceAdapter,
    IntegrationType.PAYMENT: PaymentAdapter,
    IntegrationType.SAFETY_EXAM: SafetyExamAdapter,
}


def get_adapter(integration_type: IntegrationType, db) -> BaseAdapter:
    cls = ADAPTER_MAP[integration_type]
    return cls(db)
