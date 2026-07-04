from src.modules.lab_changes.models import (
    CHANGE_STATUS_TRANSITIONS,
    ApprovalNode,
    ChangeRequestStatus,
    ChangeType,
)
from src.modules.users.models import UserRole


def test_change_status_transitions():
    assert ChangeRequestStatus.PENDING_UNIT in CHANGE_STATUS_TRANSITIONS[ChangeRequestStatus.DRAFT]
    assert ChangeRequestStatus.APPROVED in CHANGE_STATUS_TRANSITIONS[ChangeRequestStatus.PENDING_CENTER]


def test_change_types_defined():
    assert len(ChangeType) == 4


def test_user_roles_count():
    assert len(UserRole) == 6


def test_approval_nodes():
    from src.modules.lab_changes.models import NODE_FOR_STATUS

    assert NODE_FOR_STATUS[ChangeRequestStatus.PENDING_UNIT] == ApprovalNode.UNIT
    assert NODE_FOR_STATUS[ChangeRequestStatus.PENDING_CENTER] == ApprovalNode.CENTER
