import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.modules.labs.models import Lab  # noqa: F401 — register mapper for relationships
from src.modules.users.models import User  # noqa: F401 — register mapper for relationships


class ChangeType(str, enum.Enum):
    FUNCTION_ADJUSTMENT = "function_adjustment"
    MANAGER_CHANGE = "manager_change"
    EQUIPMENT_CHANGE = "equipment_change"
    ZONE_ADJUSTMENT = "zone_adjustment"


class ChangeRequestStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_UNIT = "pending_unit"
    PENDING_CENTER = "pending_center"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalNode(str, enum.Enum):
    UNIT = "unit"
    CENTER = "center"


class ApprovalAction(str, enum.Enum):
    APPROVE = "approve"
    REJECT = "reject"


CHANGE_STATUS_TRANSITIONS: dict[ChangeRequestStatus, set[ChangeRequestStatus]] = {
    ChangeRequestStatus.DRAFT: {ChangeRequestStatus.PENDING_UNIT},
    ChangeRequestStatus.PENDING_UNIT: {
        ChangeRequestStatus.PENDING_CENTER,
        ChangeRequestStatus.REJECTED,
    },
    ChangeRequestStatus.PENDING_CENTER: {
        ChangeRequestStatus.APPROVED,
        ChangeRequestStatus.REJECTED,
    },
    ChangeRequestStatus.APPROVED: set(),
    ChangeRequestStatus.REJECTED: set(),
}

NODE_FOR_STATUS: dict[ChangeRequestStatus, ApprovalNode | None] = {
    ChangeRequestStatus.PENDING_UNIT: ApprovalNode.UNIT,
    ChangeRequestStatus.PENDING_CENTER: ApprovalNode.CENTER,
}


class LabChangeRequest(Base):
    __tablename__ = "lab_change_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("labs.id"), nullable=False, index=True
    )
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    change_type: Mapped[ChangeType] = mapped_column(
        Enum(ChangeType, name="change_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    change_content: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[ChangeRequestStatus] = mapped_column(
        Enum(ChangeRequestStatus, name="change_request_status"),
        default=ChangeRequestStatus.DRAFT,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    approval_records: Mapped[list["LabChangeApprovalRecord"]] = relationship(
        back_populates="request", lazy="selectin", order_by="LabChangeApprovalRecord.created_at"
    )
    lab = relationship("Lab", lazy="selectin")
    applicant = relationship("User", lazy="selectin")


class LabChangeApprovalRecord(Base):
    __tablename__ = "lab_change_approval_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lab_change_requests.id"), nullable=False, index=True
    )
    approver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    node: Mapped[ApprovalNode] = mapped_column(Enum(ApprovalNode, name="approval_node"), nullable=False)
    action: Mapped[ApprovalAction] = mapped_column(
        Enum(ApprovalAction, name="approval_action"), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    request: Mapped["LabChangeRequest"] = relationship(back_populates="approval_records")
    approver = relationship("User", lazy="selectin")
