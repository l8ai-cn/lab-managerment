import secrets
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.lab_bookings.models import (
    AccessMethod,
    LabAccessGrant,
    LabBooking,
    LabBookingApproval,
    LabBookingRule,
    LabBookingStatus,
    LabCheckIn,
    LabUsageRecord,
    UsageReviewStatus,
)
from src.modules.lab_bookings.repository import LabBookingRepository
from src.modules.lab_bookings.schemas import (
    ApprovalRequest,
    BookingRuleCreate,
    BookingRuleResponse,
    BookingRuleUpdate,
    CalendarSlot,
    CheckInCreate,
    CheckInResponse,
    LabBookingCreate,
    LabBookingListResponse,
    LabBookingResponse,
    LabBookingUpdate,
    UsageRecordCreate,
    UsageRecordResponse,
)
from src.modules.labs.repository import LabRepository
from src.modules.users.models import User
from src.shared.notification_service import NotificationService


def _booking_response(b: LabBooking) -> LabBookingResponse:
    return LabBookingResponse(
        id=b.id,
        lab_id=b.lab_id,
        lab_name=b.lab.name if b.lab else None,
        user_id=b.user_id,
        start_time=b.start_time,
        end_time=b.end_time,
        usage_type=b.usage_type,
        purpose=b.purpose,
        expected_count=b.expected_count,
        status=b.status,
        is_recurring=b.is_recurring,
        recurrence_rule=b.recurrence_rule,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


class LabBookingService:
    def __init__(self, db: AsyncSession):
        self.repo = LabBookingRepository(db)
        self.lab_repo = LabRepository(db)
        self.notify = NotificationService(db)
        self.db = db

    async def create_rule(self, data: BookingRuleCreate) -> BookingRuleResponse:
        lab = await self.lab_repo.get_by_id(data.lab_id)
        if not lab:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验室不存在")
        existing = await self.repo.get_rule(data.lab_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="该实验室已有预约规则")
        rule = LabBookingRule(**data.model_dump())
        saved = await self.repo.save_rule(rule)
        await self.db.commit()
        return BookingRuleResponse.model_validate(saved)

    async def get_rule(self, lab_id: uuid.UUID) -> BookingRuleResponse:
        rule = await self.repo.get_rule(lab_id)
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约规则未配置")
        return BookingRuleResponse.model_validate(rule)

    async def update_rule(self, lab_id: uuid.UUID, data: BookingRuleUpdate) -> BookingRuleResponse:
        rule = await self.repo.get_rule(lab_id)
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约规则未配置")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(rule, k, v)
        saved = await self.repo.save_rule(rule)
        await self.db.commit()
        return BookingRuleResponse.model_validate(saved)

    async def delete_rule(self, lab_id: uuid.UUID) -> None:
        rule = await self.repo.get_rule(lab_id)
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约规则未配置")
        await self.repo.delete_rule(rule)
        await self.db.commit()

    async def create_booking(self, data: LabBookingCreate, user: User) -> LabBookingResponse:
        lab = await self.lab_repo.get_by_id(data.lab_id)
        if not lab:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验室不存在")
        if data.end_time <= data.start_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="结束时间须晚于开始时间")
        if await self.repo.overlapping_bookings(data.lab_id, data.start_time, data.end_time):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="时段冲突")
        booking = LabBooking(user_id=user.id, status=LabBookingStatus.PENDING, **data.model_dump())
        created = await self.repo.create_booking(booking)
        if lab.manager_id:
            await self.notify.send(
                lab.manager_id, "实验室预约待审批", f"{user.name} 申请预约 {lab.name}", "lab_booking"
            )
        await self.db.commit()
        refreshed = await self.repo.get_booking(created.id)
        return _booking_response(refreshed)  # type: ignore[arg-type]

    async def get_booking(self, booking_id: uuid.UUID) -> LabBookingResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        return _booking_response(booking)

    async def list_bookings(self, **kwargs) -> LabBookingListResponse:
        items, total = await self.repo.list_bookings(**kwargs)
        return LabBookingListResponse(
            items=[_booking_response(b) for b in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )

    async def update_booking(
        self, booking_id: uuid.UUID, data: LabBookingUpdate, user: User
    ) -> LabBookingResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        if booking.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权修改")
        if booking.status not in (LabBookingStatus.PENDING, LabBookingStatus.APPROVED):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="当前状态不可修改")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(booking, k, v)
        await self.db.commit()
        refreshed = await self.repo.get_booking(booking_id)
        return _booking_response(refreshed)  # type: ignore[arg-type]

    async def cancel_booking(self, booking_id: uuid.UUID, user: User) -> LabBookingResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        if booking.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权取消")
        if booking.status in (LabBookingStatus.CANCELLED, LabBookingStatus.COMPLETED):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="当前状态不可取消")
        booking.status = LabBookingStatus.CANCELLED
        await self.db.commit()
        refreshed = await self.repo.get_booking(booking_id)
        return _booking_response(refreshed)  # type: ignore[arg-type]

    async def approve_booking(
        self, booking_id: uuid.UUID, user: User, body: ApprovalRequest
    ) -> LabBookingResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking or booking.status != LabBookingStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="不可审批")
        await self.repo.add_approval(
            LabBookingApproval(booking_id=booking_id, approver_id=user.id, action="approve", comment=body.comment)
        )
        booking.status = LabBookingStatus.APPROVED
        await self.repo.add_access_grant(
            LabAccessGrant(
                booking_id=booking_id,
                access_method=AccessMethod.QR,
                access_token=secrets.token_urlsafe(32),
                expires_at=booking.end_time,
            )
        )
        await self.notify.send(booking.user_id, "实验室预约已通过", "您的预约申请已批准", "lab_booking")
        await self.db.commit()
        refreshed = await self.repo.get_booking(booking_id)
        return _booking_response(refreshed)  # type: ignore[arg-type]

    async def reject_booking(
        self, booking_id: uuid.UUID, user: User, body: ApprovalRequest
    ) -> LabBookingResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking or booking.status != LabBookingStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="不可审批")
        await self.repo.add_approval(
            LabBookingApproval(booking_id=booking_id, approver_id=user.id, action="reject", comment=body.comment)
        )
        booking.status = LabBookingStatus.REJECTED
        await self.notify.send(
            booking.user_id, "实验室预约已驳回", body.comment or "预约被拒绝", "lab_booking"
        )
        await self.db.commit()
        refreshed = await self.repo.get_booking(booking_id)
        return _booking_response(refreshed)  # type: ignore[arg-type]

    async def check_in(self, booking_id: uuid.UUID, data: CheckInCreate, user: User) -> CheckInResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        if booking.status != LabBookingStatus.APPROVED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="预约未批准，无法签到")
        check_in = LabCheckIn(booking_id=booking_id, method=data.method, actual_count=data.actual_count)
        saved = await self.repo.add_check_in(check_in)
        await self.db.commit()
        return CheckInResponse.model_validate(saved)

    async def calendar(
        self, lab_id: uuid.UUID, from_time: datetime, to_time: datetime
    ) -> list[CalendarSlot]:
        bookings, _ = await self.repo.list_bookings(
            lab_id=lab_id, from_time=from_time, to_time=to_time, page_size=500
        )
        return [
            CalendarSlot(
                start_time=b.start_time,
                end_time=b.end_time,
                status=b.status.value,
                usage_type=b.usage_type.value,
            )
            for b in bookings
        ]

    async def submit_usage(
        self, booking_id: uuid.UUID, data: UsageRecordCreate, user: User
    ) -> UsageRecordResponse:
        booking = await self.repo.get_booking(booking_id)
        if not booking or booking.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作")
        if await self.repo.get_usage(booking_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="已提交使用记录")
        record = LabUsageRecord(booking_id=booking_id, **data.model_dump())
        saved = await self.repo.save_usage(record)
        booking.status = LabBookingStatus.COMPLETED
        lab = await self.lab_repo.get_by_id(booking.lab_id)
        if lab and lab.manager_id:
            await self.notify.send(
                lab.manager_id, "实验室使用记录待审核", f"预约 {booking_id} 已提交使用记录", "usage"
            )
        await self.db.commit()
        return UsageRecordResponse.model_validate(saved)

    async def review_usage(
        self, booking_id: uuid.UUID, approve: bool, user: User, comment: str | None = None
    ) -> UsageRecordResponse:
        record = await self.repo.get_usage(booking_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用记录不存在")
        record.review_status = UsageReviewStatus.APPROVED if approve else UsageReviewStatus.REJECTED
        record.reviewer_id = user.id
        record.reviewer_comment = comment
        await self.db.commit()
        await self.db.refresh(record)
        return UsageRecordResponse.model_validate(record)
