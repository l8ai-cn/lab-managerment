"""CopilotKit remote actions for LabOS intelligent assistant."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from copilotkit import Action, CopilotKitRemoteEndpoint
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from fastapi import FastAPI
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session_factory
from src.modules.faults.models import FaultReport, FaultStatus
from src.modules.instruments.models import Instrument
from src.modules.lab_bookings.models import LabBooking, LabBookingStatus
from src.modules.labs.models import Lab


async def _list_labs(limit: int = 10) -> str:
    async with async_session_factory() as db:
        result = await db.execute(
            select(Lab)
            .where(Lab.deleted_at.is_(None))
            .order_by(Lab.code)
            .limit(min(limit, 50))
        )
        labs = result.scalars().all()
    if not labs:
        return "当前没有实验室数据。"
    lines = [f"- {lab.code} {lab.name}（状态: {lab.open_status.value}，容量: {lab.capacity or '-'}）" for lab in labs]
    return "实验室列表：\n" + "\n".join(lines)


async def _search_labs(keyword: str, limit: int = 10) -> str:
    async with async_session_factory() as db:
        pattern = f"%{keyword}%"
        result = await db.execute(
            select(Lab)
            .where(Lab.deleted_at.is_(None))
            .where((Lab.name.ilike(pattern)) | (Lab.code.ilike(pattern)))
            .limit(min(limit, 30))
        )
        labs = result.scalars().all()
    if not labs:
        return f"未找到匹配「{keyword}」的实验室。"
    lines = [f"- {lab.code} {lab.name}" for lab in labs]
    return f"搜索「{keyword}」结果：\n" + "\n".join(lines)


async def _list_instruments(lab_code: str | None = None, limit: int = 10) -> str:
    async with async_session_factory() as db:
        query = select(Instrument).where(Instrument.deleted_at.is_(None))
        if lab_code:
            lab_result = await db.execute(
                select(Lab).where(Lab.code == lab_code, Lab.deleted_at.is_(None))
            )
            lab = lab_result.scalar_one_or_none()
            if not lab:
                return f"未找到编号为 {lab_code} 的实验室。"
            query = query.where(Instrument.lab_id == lab.id)
        result = await db.execute(query.order_by(Instrument.code).limit(min(limit, 30)))
        instruments = result.scalars().all()
    if not instruments:
        return "未找到仪器数据。"
    lines = [f"- {i.code} {i.name}（状态: {i.status.value}）" for i in instruments]
    return "仪器列表：\n" + "\n".join(lines)


async def _list_bookings(status: str | None = None, limit: int = 10) -> str:
    async with async_session_factory() as db:
        query = select(LabBooking).order_by(LabBooking.start_time.desc())
        if status:
            try:
                query = query.where(LabBooking.status == LabBookingStatus(status))
            except ValueError:
                return f"无效状态: {status}，可选: pending, approved, rejected, cancelled, completed"
        result = await db.execute(query.limit(min(limit, 30)))
        bookings = result.scalars().all()
        lab_ids = {b.lab_id for b in bookings}
        lab_map: dict[uuid.UUID, str] = {}
        if lab_ids:
            lab_result = await db.execute(select(Lab).where(Lab.id.in_(lab_ids)))
            lab_map = {lab.id: f"{lab.code} {lab.name}" for lab in lab_result.scalars().all()}
    if not bookings:
        return "暂无预约记录。"
    lines = []
    for b in bookings:
        lab_name = lab_map.get(b.lab_id, str(b.lab_id))
        start = b.start_time.strftime("%Y-%m-%d %H:%M") if b.start_time else "-"
        lines.append(f"- {lab_name} | {start} | {b.usage_type.value} | {b.status.value}")
    return "实验室预约：\n" + "\n".join(lines)


async def _fault_summary() -> str:
    async with async_session_factory() as db:
        total = await db.scalar(select(func.count()).select_from(FaultReport)) or 0
        pending = await db.scalar(
            select(func.count()).select_from(FaultReport).where(FaultReport.status == FaultStatus.PENDING)
        ) or 0
    return f"故障统计：总数 {total}，待处理 {pending}"


async def _platform_overview() -> str:
    async with async_session_factory() as db:
        lab_count = await db.scalar(
            select(func.count()).select_from(Lab).where(Lab.deleted_at.is_(None))
        ) or 0
        instrument_count = await db.scalar(
            select(func.count()).select_from(Instrument).where(Instrument.deleted_at.is_(None))
        ) or 0
        booking_count = await db.scalar(select(func.count()).select_from(LabBooking)) or 0
        pending_bookings = await db.scalar(
            select(func.count())
            .select_from(LabBooking)
            .where(LabBooking.status == LabBookingStatus.PENDING)
        ) or 0
    return (
        f"平台概览（{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}）：\n"
        f"- 实验室: {lab_count}\n"
        f"- 仪器: {instrument_count}\n"
        f"- 预约总数: {booking_count}\n"
        f"- 待审批预约: {pending_bookings}"
    )


async def _handle_list_labs(limit: int = 10) -> str:
    return await _list_labs(int(limit))


async def _handle_search_labs(keyword: str, limit: int = 10) -> str:
    return await _search_labs(keyword, int(limit))


async def _handle_list_instruments(lab_code: str | None = None, limit: int = 10) -> str:
    return await _list_instruments(lab_code, int(limit))


async def _handle_list_bookings(status: str | None = None, limit: int = 10) -> str:
    return await _list_bookings(status, int(limit))


async def _handle_fault_summary() -> str:
    return await _fault_summary()


async def _handle_platform_overview() -> str:
    return await _platform_overview()


async def _create_fault_report(lab_code: str, fault_type: str, description: str) -> str:
    async with async_session_factory() as db:
        from src.modules.faults.models import FaultReport, FaultStatus
        from src.modules.labs.models import Lab
        from src.modules.users.models import User, UserRole
        import secrets

        lab_result = await db.execute(select(Lab).where(Lab.code == lab_code, Lab.deleted_at.is_(None)))
        lab = lab_result.scalar_one_or_none()
        if not lab:
            return f"未找到实验室: {lab_code}"
        user_result = await db.execute(select(User).where(User.role == UserRole.SYSTEM_ADMIN).limit(1))
        user = user_result.scalar_one_or_none()
        if not user:
            user_result = await db.execute(select(User).limit(1))
            user = user_result.scalar_one_or_none()
        if not user:
            return "系统中无可用用户"
        report = FaultReport(
            lab_id=lab.id,
            reporter_id=user.id,
            fault_type=fault_type,
            description=description,
            status=FaultStatus.PENDING,
            qr_code_token=secrets.token_urlsafe(16),
        )
        db.add(report)
        await db.commit()
        return f"故障报告已创建，ID: {report.id}，类型: {fault_type}，实验室: {lab.name}"


async def _search_knowledge(query: str, limit: int = 5) -> str:
    async with async_session_factory() as db:
        from src.modules.knowledge.service import KnowledgeService

        service = KnowledgeService(db)
        results = await service.search(query, limit=min(int(limit), 10))
    if not results:
        return f"知识库中未找到与「{query}」相关的内容。"
    lines = [f"- {r.title}: {r.snippet}" for r in results]
    return f"知识库搜索「{query}」结果：\n" + "\n".join(lines)


async def _handle_create_fault_report(lab_code: str, fault_type: str, description: str) -> str:
    return await _create_fault_report(lab_code, fault_type, description)


async def _handle_search_knowledge(query: str, limit: int = 5) -> str:
    return await _search_knowledge(query, int(limit))


def build_copilot_sdk() -> CopilotKitRemoteEndpoint:
    return CopilotKitRemoteEndpoint(
        actions=[
            Action(
                name="list_labs",
                description="列出实验室，含编号、名称、开放状态与容量",
                parameters=[
                    {"name": "limit", "type": "number", "description": "返回条数，默认10", "required": False},
                ],
                handler=_handle_list_labs,
            ),
            Action(
                name="search_labs",
                description="按关键词搜索实验室（编号或名称）",
                parameters=[
                    {"name": "keyword", "type": "string", "description": "搜索关键词", "required": True},
                    {"name": "limit", "type": "number", "description": "返回条数", "required": False},
                ],
                handler=_handle_search_labs,
            ),
            Action(
                name="list_instruments",
                description="列出仪器台账，可按实验室编号筛选",
                parameters=[
                    {"name": "lab_code", "type": "string", "description": "实验室编号", "required": False},
                    {"name": "limit", "type": "number", "description": "返回条数", "required": False},
                ],
                handler=_handle_list_instruments,
            ),
            Action(
                name="list_lab_bookings",
                description="列出实验室预约记录，可按状态筛选",
                parameters=[
                    {
                        "name": "status",
                        "type": "string",
                        "description": "pending/approved/rejected/cancelled/completed",
                        "required": False,
                    },
                    {"name": "limit", "type": "number", "description": "返回条数", "required": False},
                ],
                handler=_handle_list_bookings,
            ),
            Action(
                name="get_fault_summary",
                description="获取故障上报统计（总数、待处理数）",
                parameters=[],
                handler=_handle_fault_summary,
            ),
            Action(
                name="get_platform_overview",
                description="获取平台运行概览（实验室/仪器/预约统计）",
                parameters=[],
                handler=_handle_platform_overview,
            ),
            Action(
                name="create_fault_report",
                description="创建故障报修记录",
                parameters=[
                    {"name": "lab_code", "type": "string", "description": "实验室编号", "required": True},
                    {"name": "fault_type", "type": "string", "description": "故障类型", "required": True},
                    {"name": "description", "type": "string", "description": "故障描述", "required": True},
                ],
                handler=_handle_create_fault_report,
            ),
            Action(
                name="search_knowledge",
                description="搜索知识库文档（安全规范、预约政策等）",
                parameters=[
                    {"name": "query", "type": "string", "description": "搜索关键词", "required": True},
                    {"name": "limit", "type": "number", "description": "返回条数", "required": False},
                ],
                handler=_handle_search_knowledge,
            ),
        ]
    )


def register_copilotkit_routes(app: FastAPI) -> None:
    sdk = build_copilot_sdk()
    add_fastapi_endpoint(app, sdk, "/api/copilotkit-remote")
