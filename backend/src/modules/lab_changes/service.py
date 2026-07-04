import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.lab_changes.models import (
    NODE_FOR_STATUS,
    ApprovalAction,
    ApprovalNode,
    ChangeRequestStatus,
    LabChangeApprovalRecord,
    LabChangeRequest,
)
from src.modules.lab_changes.repository import LabChangeRepository
from src.modules.lab_changes.schemas import (
    ApprovalActionRequest,
    ApprovalRecordResponse,
    ChangeRequestCreate,
    ChangeRequestListResponse,
    ChangeRequestResponse,
    ChangeRequestUpdate,
)
from src.modules.labs.repository import LabRepository
from src.modules.users.models import User, UserRole


def _to_response(req: LabChangeRequest) -> ChangeRequestResponse:
    records = [
        ApprovalRecordResponse(
            id=r.id,
            approver_id=r.approver_id,
            approver_name=r.approver.name if r.approver else None,
            node=r.node,
            action=r.action,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in req.approval_records
    ]
    return ChangeRequestResponse(
        id=req.id,
        lab_id=req.lab_id,
        applicant_id=req.applicant_id,
        applicant_name=req.applicant.name if req.applicant else None,
        change_type=req.change_type,
        title=req.title,
        description=req.description,
        change_content=req.change_content or {},
        status=req.status,
        lab_name=req.lab.name if req.lab else None,
        lab_code=req.lab.code if req.lab else None,
        approval_records=records,
        created_at=req.created_at,
        updated_at=req.updated_at,
    )


class LabChangeService:
    def __init__(self, db: AsyncSession):
        self.repo = LabChangeRepository(db)
        self.lab_repo = LabRepository(db)
        self.db = db

    async def create(self, data: ChangeRequestCreate, applicant: User) -> ChangeRequestResponse:
        lab = await self.lab_repo.get_by_id(data.lab_id)
        if not lab:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验室不存在")

        request = LabChangeRequest(
            lab_id=data.lab_id,
            applicant_id=applicant.id,
            change_type=data.change_type,
            title=data.title,
            description=data.description,
            change_content=data.change_content,
        )
        created = await self.repo.create(request)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(created.id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def get(self, request_id: uuid.UUID) -> ChangeRequestResponse:
        req = await self.repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="变更申请不存在")
        return _to_response(req)

    async def list(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        lab_id: uuid.UUID | None = None,
        status: ChangeRequestStatus | None = None,
        applicant_id: uuid.UUID | None = None,
    ) -> ChangeRequestListResponse:
        items, total = await self.repo.list_requests(
            page=page, page_size=page_size, lab_id=lab_id, status=status, applicant_id=applicant_id
        )
        return ChangeRequestListResponse(
            items=[_to_response(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(
        self, request_id: uuid.UUID, data: ChangeRequestUpdate, user: User
    ) -> ChangeRequestResponse:
        req = await self.repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="变更申请不存在")
        if req.status != ChangeRequestStatus.DRAFT:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="仅草稿可编辑")
        if req.applicant_id != user.id and user.role != UserRole.SYSTEM_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权编辑")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(req, field, value)
        await self.repo.update(req)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(request_id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def submit(self, request_id: uuid.UUID, user: User) -> ChangeRequestResponse:
        return await self._transition(request_id, ChangeRequestStatus.PENDING_UNIT, user)

    async def approve(self, request_id: uuid.UUID, user: User, body: ApprovalActionRequest) -> ChangeRequestResponse:
        req = await self.repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="变更申请不存在")

        node = NODE_FOR_STATUS.get(req.status)
        if not node:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="当前状态不可审批")

        self._check_approval_permission(user, node)

        if req.status == ChangeRequestStatus.PENDING_UNIT:
            next_status = ChangeRequestStatus.PENDING_CENTER
        elif req.status == ChangeRequestStatus.PENDING_CENTER:
            next_status = ChangeRequestStatus.APPROVED
        else:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="当前状态不可审批")

        await self.repo.add_approval_record(
            LabChangeApprovalRecord(
                request_id=request_id,
                approver_id=user.id,
                node=node,
                action=ApprovalAction.APPROVE,
                comment=body.comment,
            )
        )
        req.status = next_status
        await self.repo.update(req)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(request_id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def reject(self, request_id: uuid.UUID, user: User, body: ApprovalActionRequest) -> ChangeRequestResponse:
        req = await self.repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="变更申请不存在")

        node = NODE_FOR_STATUS.get(req.status)
        if not node:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="当前状态不可审批")

        self._check_approval_permission(user, node)

        await self.repo.add_approval_record(
            LabChangeApprovalRecord(
                request_id=request_id,
                approver_id=user.id,
                node=node,
                action=ApprovalAction.REJECT,
                comment=body.comment,
            )
        )
        req.status = ChangeRequestStatus.REJECTED
        await self.repo.update(req)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(request_id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    async def _transition(
        self, request_id: uuid.UUID, target: ChangeRequestStatus, user: User
    ) -> ChangeRequestResponse:
        req = await self.repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="变更申请不存在")
        if req.applicant_id != user.id and user.role != UserRole.SYSTEM_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作")

        from src.modules.lab_changes.models import CHANGE_STATUS_TRANSITIONS

        allowed = CHANGE_STATUS_TRANSITIONS.get(req.status, set())
        if target not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"不允许从 {req.status.value} 转换到 {target.value}",
            )

        req.status = target
        await self.repo.update(req)
        await self.db.commit()
        refreshed = await self.repo.get_by_id(request_id)
        return _to_response(refreshed)  # type: ignore[arg-type]

    def _check_approval_permission(self, user: User, node: ApprovalNode) -> None:
        if user.role == UserRole.SYSTEM_ADMIN:
            return
        if node == ApprovalNode.UNIT and user.role == UserRole.DEPT_ADMIN:
            return
        if node == ApprovalNode.CENTER and user.role in (UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权审批此节点")
