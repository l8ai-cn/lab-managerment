import io
import secrets
import uuid
from datetime import UTC, datetime, timedelta

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
from src.shared.booking_rules import (
    day_bounds,
    resolve_lab_type_rules,
    should_auto_approve_lab,
    validate_allowed_roles,
    validate_daily_limit,
    validate_open_hours,
)
from src.shared.notification_service import NotificationService
from src.shared.push import send_push


def _expand_recurring_slots(
    start: datetime, end: datetime, rule: dict | None
) -> list[tuple[datetime, datetime]]:
    if not rule:
        return [(start, end)]
    frequency = rule.get("frequency", "weekly")
    count = int(rule.get("count", 1))
    interval = int(rule.get("interval", 1))
    delta_map = {"daily": timedelta(days=interval), "weekly": timedelta(weeks=interval), "monthly": timedelta(days=30 * interval)}
    delta = delta_map.get(frequency, timedelta(weeks=interval))
    duration = end - start
    slots = []
    for i in range(count):
        slot_start = start + delta * i
        slots.append((slot_start, slot_start + duration))
    return slots


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

        rule = await self.repo.get_rule(data.lab_id)
        auto_approve = False
        if rule:
            validate_allowed_roles(rule.allowed_roles, user)
            validate_open_hours(rule.open_hours, data.start_time, data.end_time)
            day_start, day_end = day_bounds(data.start_time)
            daily_count = await self.repo.count_user_bookings_in_range(
                data.lab_id, user.id, day_start, day_end
            )
            validate_daily_limit(daily_count, rule.daily_limit)
            type_rule = resolve_lab_type_rules(rule.usage_type_rules, data.usage_type.value)
            if type_rule.get("daily_limit") is not None:
                type_count = await self.repo.count_user_bookings_in_range(
                    data.lab_id, user.id, day_start, day_end, usage_type=data.usage_type.value
                )
                validate_daily_limit(type_count, type_rule["daily_limit"], label="该类型每日")
            auto_approve = should_auto_approve_lab(rule.usage_type_rules, data.usage_type.value)

        slots = _expand_recurring_slots(data.start_time, data.end_time, data.recurrence_rule if data.is_recurring else None)
        created_booking = None
        for slot_start, slot_end in slots:
            if rule:
                validate_open_hours(rule.open_hours, slot_start, slot_end)
            if await self.repo.overlapping_bookings(data.lab_id, slot_start, slot_end):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"时段冲突: {slot_start.isoformat()}")
            booking = LabBooking(
                user_id=user.id,
                status=LabBookingStatus.APPROVED if auto_approve else LabBookingStatus.PENDING,
                lab_id=data.lab_id,
                start_time=slot_start,
                end_time=slot_end,
                usage_type=data.usage_type,
                purpose=data.purpose,
                expected_count=data.expected_count,
                is_recurring=data.is_recurring,
                recurrence_rule=data.recurrence_rule,
            )
            created_booking = await self.repo.create_booking(booking)
            if auto_approve:
                await self.repo.add_access_grant(
                    LabAccessGrant(
                        booking_id=created_booking.id,
                        access_method=AccessMethod.QR,
                        access_token=secrets.token_urlsafe(32),
                        expires_at=slot_end,
                    )
                )

        if lab.manager_id and created_booking and not auto_approve:
            await self.notify.send(
                lab.manager_id, "实验室预约待审批", f"{user.name} 申请预约 {lab.name}", "lab_booking"
            )
        await self.db.commit()
        refreshed = await self.repo.get_booking(created_booking.id)  # type: ignore[union-attr]
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
        await send_push(
            self.db,
            user_id=booking.user_id,
            title="实验室预约已通过",
            content="您的预约申请已批准，请按时签到",
            category="lab_booking",
        )
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

    async def list_pending_usage(self, *, page: int = 1, page_size: int = 50):
        from src.modules.lab_bookings.schemas import PendingUsageItem, PendingUsageListResponse

        records, total = await self.repo.list_pending_usage(page=page, page_size=page_size)
        items = [
            PendingUsageItem(
                booking_id=r.booking_id,
                lab_id=r.booking.lab_id if r.booking else r.booking_id,
                lab_name=r.booking.lab.name if r.booking and r.booking.lab else None,
                content=r.content,
                review_status=r.review_status,
                created_at=r.created_at,
            )
            for r in records
        ]
        return PendingUsageListResponse(items=items, total=total)

    async def batch_review_usage(
        self, booking_ids: list[uuid.UUID], approve: bool, user: User, comment: str | None = None
    ):
        from src.modules.lab_bookings.schemas import BatchUsageReviewResponse

        processed = 0
        failed: list[uuid.UUID] = []
        for bid in booking_ids:
            record = await self.repo.get_usage(bid)
            if not record or record.review_status != UsageReviewStatus.PENDING:
                failed.append(bid)
                continue
            record.review_status = UsageReviewStatus.APPROVED if approve else UsageReviewStatus.REJECTED
            record.reviewer_id = user.id
            record.reviewer_comment = comment
            processed += 1
        await self.db.commit()
        return BatchUsageReviewResponse(processed=processed, failed=failed)

    async def get_access_grants(self, booking_id: uuid.UUID) -> list:
        booking = await self.repo.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="预约不存在")
        from src.modules.lab_bookings.schemas import AccessGrantResponse

        return [AccessGrantResponse.model_validate(g) for g in booking.access_grants]

    async def export_bookings(self, fmt: str = "xlsx", **kwargs) -> tuple[bytes, str, str]:
        items, _ = await self.repo.list_bookings(page_size=5000, **kwargs)
        if fmt == "csv":
            lines = ["id,lab_id,user_id,start_time,end_time,usage_type,status,purpose"]
            for b in items:
                lines.append(
                    f"{b.id},{b.lab_id},{b.user_id},{b.start_time.isoformat()},{b.end_time.isoformat()},"
                    f"{b.usage_type.value},{b.status.value},\"{b.purpose.replace(chr(34), chr(39))}\""
                )
            content = "\n".join(lines).encode("utf-8-sig")
            return content, "text/csv", "lab_bookings.csv"
        try:
            import openpyxl
        except ImportError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="openpyxl 未安装") from e
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "实验室预约"
        ws.append(["ID", "实验室", "用户ID", "开始时间", "结束时间", "用途类型", "状态", "目的"])
        for b in items:
            ws.append([
                str(b.id),
                b.lab.name if b.lab else str(b.lab_id),
                str(b.user_id),
                b.start_time.isoformat(),
                b.end_time.isoformat(),
                b.usage_type.value,
                b.status.value,
                b.purpose,
            ])
        buffer = io.BytesIO()
        wb.save(buffer)
        return (
            buffer.getvalue(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "lab_bookings.xlsx",
        )
