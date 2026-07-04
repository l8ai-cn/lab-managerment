import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.faults.models import FaultHandlingRecord, FaultReport, FaultStatus
from src.modules.faults.repository import FaultRepository
from src.modules.faults.schemas import (
    AssignRequest,
    FaultQrResponse,
    FaultReportCreate,
    FaultReportListResponse,
    FaultReportResponse,
    FaultReportUpdate,
    FaultStatsResponse,
    HandleRequest,
    HandlingRecordResponse,
    StatusUpdateRequest,
)
from src.modules.labs.repository import LabRepository
from src.modules.users.models import User
from src.shared.notification_service import NotificationService
from src.shared.push import send_push


def _report_response(r: FaultReport) -> FaultReportResponse:
    return FaultReportResponse(
        id=r.id,
        lab_id=r.lab_id,
        lab_name=r.lab.name if r.lab else None,
        reporter_id=r.reporter_id,
        fault_type=r.fault_type,
        description=r.description,
        status=r.status,
        assignee_id=r.assignee_id,
        attachments=r.attachments,
        qr_code_token=r.qr_code_token,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


class FaultService:
    def __init__(self, db: AsyncSession):
        self.repo = FaultRepository(db)
        self.lab_repo = LabRepository(db)
        self.notify = NotificationService(db)
        self.db = db

    async def create(self, data: FaultReportCreate, user: User) -> FaultReportResponse:
        lab = await self.lab_repo.get_by_id(data.lab_id)
        if not lab:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验室不存在")
        report = FaultReport(
            reporter_id=user.id,
            qr_code_token=secrets.token_urlsafe(16),
            **data.model_dump(),
        )
        created = await self.repo.create_report(report)
        if lab.manager_id:
            await self.notify.send(
                lab.manager_id, "新故障报修", f"{user.name} 报告了 {data.fault_type}", "fault"
            )
        await self.db.commit()
        refreshed = await self.repo.get_report(created.id)
        return _report_response(refreshed)  # type: ignore[arg-type]

    async def get(self, report_id: uuid.UUID) -> FaultReportResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        return _report_response(report)

    async def list(self, **kwargs) -> FaultReportListResponse:
        items, total = await self.repo.list_reports(**kwargs)
        return FaultReportListResponse(
            items=[_report_response(r) for r in items],
            total=total,
            page=kwargs.get("page", 1),
            page_size=kwargs.get("page_size", 20),
        )

    async def update(self, report_id: uuid.UUID, data: FaultReportUpdate) -> FaultReportResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(report, k, v)
        await self.db.commit()
        refreshed = await self.repo.get_report(report_id)
        return _report_response(refreshed)  # type: ignore[arg-type]

    async def delete(self, report_id: uuid.UUID) -> None:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        await self.db.delete(report)
        await self.db.commit()

    async def assign(self, report_id: uuid.UUID, data: AssignRequest, user: User) -> FaultReportResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        report.assignee_id = data.assignee_id
        report.status = FaultStatus.ASSIGNED
        await self.repo.add_handling_record(
            FaultHandlingRecord(
                report_id=report_id, handler_id=user.id, action="assign", comment=f"指派给 {data.assignee_id}"
            )
        )
        await self.notify.send(data.assignee_id, "故障已指派", f"您被指派处理故障 {report.fault_type}", "fault")
        await send_push(
            self.db,
            user_id=data.assignee_id,
            title="故障已指派",
            content=f"您被指派处理故障: {report.fault_type}",
            category="fault",
        )
        await self.db.commit()
        refreshed = await self.repo.get_report(report_id)
        return _report_response(refreshed)  # type: ignore[arg-type]

    async def update_status(
        self, report_id: uuid.UUID, data: StatusUpdateRequest, user: User
    ) -> FaultReportResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        report.status = data.status
        await self.repo.add_handling_record(
            FaultHandlingRecord(
                report_id=report_id,
                handler_id=user.id,
                action="status_change",
                comment=f"状态变更为 {data.status.value}",
            )
        )
        await self.db.commit()
        refreshed = await self.repo.get_report(report_id)
        return _report_response(refreshed)  # type: ignore[arg-type]

    async def handle(
        self, report_id: uuid.UUID, data: HandleRequest, user: User
    ) -> HandlingRecordResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        if report.status == FaultStatus.PENDING:
            report.status = FaultStatus.PROCESSING
        record = FaultHandlingRecord(
            report_id=report_id, handler_id=user.id, action=data.action, comment=data.comment
        )
        saved = await self.repo.add_handling_record(record)
        await self.notify.send(report.reporter_id, "故障处理更新", data.comment or data.action, "fault")
        await self.db.commit()
        return HandlingRecordResponse.model_validate(saved)

    async def stats(self) -> FaultStatsResponse:
        reports, total = await self.repo.stats()
        by_status: dict[str, int] = {}
        by_type: dict[str, int] = {}
        by_lab: dict[str, int] = {}
        response_hours: list[float] = []
        resolution_hours: list[float] = []
        resolved_count = 0
        sla_within_24h = 0
        sla_within_72h = 0

        for r in reports:
            by_status[r.status.value] = by_status.get(r.status.value, 0) + 1
            by_type[r.fault_type] = by_type.get(r.fault_type, 0) + 1
            lab_name = r.lab.name if r.lab else str(r.lab_id)
            by_lab[lab_name] = by_lab.get(lab_name, 0) + 1

            first_action = None
            resolved_at = None
            for record in sorted(r.handling_records, key=lambda x: x.created_at):
                if record.action in ("assign", "status_change", "handle") and first_action is None:
                    first_action = record.created_at
                if record.action in ("status_change", "handle") and "resolved" in (record.comment or "").lower():
                    resolved_at = record.created_at
            if r.status in (FaultStatus.RESOLVED, FaultStatus.CLOSED):
                resolved_at = resolved_at or r.updated_at
                resolved_count += 1
                hours = (resolved_at - r.created_at).total_seconds() / 3600
                resolution_hours.append(hours)
                if hours <= 24:
                    sla_within_24h += 1
                if hours <= 72:
                    sla_within_72h += 1
            if first_action:
                response_hours.append((first_action - r.created_at).total_seconds() / 3600)

        avg_response = round(sum(response_hours) / len(response_hours), 1) if response_hours else None
        avg_resolution = round(sum(resolution_hours) / len(resolution_hours), 1) if resolution_hours else None

        return FaultStatsResponse(
            total=total,
            by_status=by_status,
            by_type=by_type,
            by_lab=by_lab,
            avg_response_hours=avg_response,
            avg_resolution_hours=avg_resolution,
            resolved_count=resolved_count,
            sla_within_24h=sla_within_24h,
            sla_within_72h=sla_within_72h,
        )

    async def get_lab_fault_qr(self, lab_id: uuid.UUID) -> FaultQrResponse:
        lab = await self.lab_repo.get_by_id(lab_id)
        if not lab:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="实验室不存在")
        token = await self.repo.get_lab_qr_token(lab_id) or secrets.token_urlsafe(16)
        return FaultQrResponse(
            lab_id=lab_id,
            qr_token=token,
            url=f"/fault-report?lab_id={lab_id}&token={token}",
        )

    async def add_attachment(self, report_id: uuid.UUID, url: str) -> FaultReportResponse:
        report = await self.repo.get_report(report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="故障报告不存在")
        attachments = list(report.attachments or [])
        attachments.append(url)
        report.attachments = attachments
        await self.db.commit()
        refreshed = await self.repo.get_report(report_id)
        return _report_response(refreshed)  # type: ignore[arg-type]
