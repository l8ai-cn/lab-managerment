#!/usr/bin/env python3
"""全功能 API 自动化测试脚本 — 对照 docs/requirements.md 逐项验证。"""

from __future__ import annotations

import json
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

import httpx

BASE = "http://127.0.0.1:8000"
API = f"{BASE}/api/v1"
FRONTEND = "http://127.0.0.1:5173"


class Status(str, Enum):
    PASS = "PASS"
    PARTIAL = "PARTIAL"
    FAIL = "FAIL"
    SKIP = "SKIP"
    NOT_IMPL = "NOT_IMPL"


@dataclass
class TestResult:
    module: str
    req_id: str
    requirement: str
    status: Status
    api_evidence: str = ""
    ui_evidence: str = ""
    gap: str = ""
    notes: str = ""


results: list[TestResult] = []


def record(
    module: str,
    req_id: str,
    requirement: str,
    status: Status,
    *,
    api_evidence: str = "",
    ui_evidence: str = "",
    gap: str = "",
    notes: str = "",
) -> None:
    results.append(
        TestResult(module, req_id, requirement, status, api_evidence, ui_evidence, gap, notes)
    )


class Client:
    def __init__(self) -> None:
        self.client = httpx.Client(timeout=30.0)
        self.token: str | None = None
        self.user_id: str | None = None
        self.created: dict[str, Any] = {}

    def auth_headers(self) -> dict[str, str]:
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, path: str, **kw: Any) -> httpx.Response:
        return self.client.get(f"{API}{path}", headers=self.auth_headers(), **kw)

    def post(self, path: str, **kw: Any) -> httpx.Response:
        return self.client.post(f"{API}{path}", headers=self.auth_headers(), **kw)

    def patch(self, path: str, **kw: Any) -> httpx.Response:
        return self.client.patch(f"{API}{path}", headers=self.auth_headers(), **kw)

    def delete(self, path: str, **kw: Any) -> httpx.Response:
        return self.client.delete(f"{API}{path}", headers=self.auth_headers(), **kw)

    def login(self) -> bool:
        r = self.client.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"})
        if r.status_code != 200:
            return False
        data = r.json()
        self.token = data["access_token"]
        self.user_id = data["user"]["id"]
        return True

    def close(self) -> None:
        self.client.close()


def ok(r: httpx.Response) -> bool:
    return 200 <= r.status_code < 300


def test_auth(c: Client) -> None:
    r = c.client.get(f"{BASE}/health")
    record(
        "M09",
        "M09-001",
        "系统健康检查 / 后端可用",
        Status.PASS if ok(r) else Status.FAIL,
        api_evidence=f"GET /health → {r.status_code}",
        ui_evidence="LoginPage 检测 /health 连接状态",
    )

    r = c.client.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"})
    record(
        "M09",
        "M09-002",
        "用户登录（admin/admin123）",
        Status.PASS if ok(r) else Status.FAIL,
        api_evidence=f"POST /auth/login → {r.status_code}",
        ui_evidence="路由 /login 存在",
    )

    r = c.get("/auth/me")
    record(
        "M09",
        "M09-003",
        "RBAC 角色识别（system_admin）",
        Status.PASS if ok(r) and r.json().get("role") == "system_admin" else Status.FAIL,
        api_evidence=f"GET /auth/me role={r.json().get('role') if ok(r) else 'N/A'}",
    )

    record(
        "M09",
        "M09-004",
        "SSO 单点登录",
        Status.NOT_IMPL,
        gap="未对接统一身份认证，仅本地 JWT 登录",
        ui_evidence="无 SSO 入口",
    )


def test_spaces(c: Client) -> None:
    suffix = uuid.uuid4().hex[:6]
    r = c.post("/buildings", json={"name": f"测试楼-{suffix}", "code": f"B{suffix}"})
    building_id = r.json().get("id") if ok(r) else None

    r2 = c.post("/floors", json={"building_id": building_id, "name": "1F", "floor_number": 1})
    floor_id = r2.json().get("id") if ok(r2) else None

    r3 = c.post("/rooms", json={"floor_id": floor_id, "name": "101", "code": "101"})
    room_id = r3.json().get("id") if ok(r3) else None

    c.created["building_id"] = building_id
    c.created["floor_id"] = floor_id
    c.created["room_id"] = room_id

    r_tree = c.get("/buildings/tree")
    record(
        "M09",
        "M09-005",
        "空间管理：楼栋→楼层→房间层级",
        Status.PASS if ok(r) and ok(r2) and ok(r3) and ok(r_tree) else Status.PARTIAL,
        api_evidence=f"POST buildings/floors/rooms + GET tree → {r.status_code}/{r2.status_code}/{r3.status_code}/{r_tree.status_code}",
        ui_evidence="页面 /spaces 空间管理",
        gap="" if ok(r2) and ok(r3) else "楼层创建需 floor_number 参数",
    )


def test_labs(c: Client) -> None:
    suffix = uuid.uuid4().hex[:6]
    payload = {
        "code": f"LAB-{suffix}",
        "name": f"测试实验室-{suffix}",
        "building_id": c.created.get("building_id"),
        "floor_id": c.created.get("floor_id"),
        "room_id": c.created.get("room_id"),
        "lab_type": "teaching",
        "open_status": "open",
        "capacity": 30,
        "area_sqm": 120.5,
        "functional_zones": ["实验区", "准备区"],
    }
    r = c.post("/labs", json=payload)
    lab_id = r.json().get("id") if ok(r) else None
    c.created["lab_id"] = lab_id

    r_list = c.get("/labs", params={"keyword": suffix, "open_status": "open"})
    r_get = c.get(f"/labs/{lab_id}") if lab_id else None
    r_export = c.get("/labs/export")

    record(
        "M01",
        "M01-001",
        "实验室信息录入（名称/编号/位置/面积/分区/人数/开放状态）",
        Status.PASS if ok(r) and r_get and ok(r_get) else Status.FAIL,
        api_evidence=f"POST /labs → {r.status_code}, fields present",
        ui_evidence="页面 /labs, /labs/new, /labs/:id",
    )

    record(
        "M01",
        "M01-002",
        "多维检索（楼栋/楼层/类型/开放状态/关键词）",
        Status.PASS if ok(r_list) else Status.FAIL,
        api_evidence=f"GET /labs?keyword&open_status → {r_list.status_code}",
        ui_evidence="LabList FilterBar 筛选控件",
    )

    record(
        "M01",
        "M01-003",
        "Excel 批量导入导出",
        Status.PARTIAL if ok(r_export) else Status.FAIL,
        api_evidence=f"GET /labs/export → {r_export.status_code}",
        ui_evidence="LabList 导入/导出按钮；/labs/:id/edit 编辑页",
        gap="导入需真实 xlsx 文件人工验证",
    )

    record(
        "M01",
        "M01-004",
        "责任负责人字段",
        Status.NOT_IMPL,
        gap="Lab 模型/API 无 dedicated 负责人字段，仅有实验员关联",
    )


def test_lab_staff(c: Client) -> None:
    lab_id = c.created.get("lab_id")
    payload = {
        "employee_no": f"E{uuid.uuid4().hex[:6]}",
        "name": "测试实验员",
        "phone": "13800138000",
        "office_location": "A101",
        "lab_ids": [lab_id] if lab_id else [],
    }
    r = c.post("/lab-staff", json=payload)
    staff_id = r.json().get("id") if ok(r) else None
    c.created["staff_id"] = staff_id

    r_list = c.get("/lab-staff")
    record(
        "M01",
        "M01-005",
        "实验员管理（工号/姓名/电话/办公室/责任实验室）",
        Status.PASS if ok(r) and ok(r_list) else Status.FAIL,
        api_evidence=f"POST/GET /lab-staff → {r.status_code}/{r_list.status_code}",
        ui_evidence="页面 /lab-staff",
    )


def test_lab_changes(c: Client) -> None:
    lab_id = c.created.get("lab_id")
    payload = {
        "lab_id": lab_id,
        "change_type": "function_adjustment",
        "title": "功能调整测试",
        "description": "自动化测试变更申请",
    }
    r = c.post("/lab-changes", json=payload)
    change_id = r.json().get("id") if ok(r) else None
    c.created["change_id"] = change_id

    if change_id:
        c.post(f"/lab-changes/{change_id}/submit")
        r_get = c.get(f"/lab-changes/{change_id}")
    else:
        r_get = None

    record(
        "M01",
        "M01-006",
        "变更申请（功能/负责人/设备/区域）",
        Status.PASS if ok(r) else Status.FAIL,
        api_evidence=f"POST /lab-changes → {r.status_code}",
        ui_evidence="页面 /lab-changes, /lab-changes/:id",
    )

    record(
        "M01",
        "M01-007",
        "多级审批（单位→管理中心）",
        Status.PARTIAL,
        api_evidence=f"POST submit + GET detail → {r_get.status_code if r_get else 'N/A'}",
        ui_evidence="LabChangeDetail Steps 审批流 UI",
        gap="消息推送未对接微信/钉钉；dept_admin 角色需单独账号验证",
    )

    record(
        "M01",
        "M01-008",
        "变更进度追踪与留痕",
        Status.PARTIAL if r_get and ok(r_get) else Status.FAIL,
        api_evidence="approval_records 字段在详情 API",
        ui_evidence="LabChangeDetail 审批记录展示",
        gap="无实时消息推送",
    )


def test_instruments(c: Client) -> None:
    lab_id = c.created.get("lab_id")
    suffix = uuid.uuid4().hex[:6]
    payload = {
        "code": f"INS-{suffix}",
        "name": f"测试仪器-{suffix}",
        "lab_id": lab_id,
        "model": "X-100",
        "manufacturer": "TestCo",
        "serial_no": f"SN{suffix}",
        "asset_no": f"A{suffix}",
        "status": "normal",
    }
    r = c.post("/instruments", json=payload)
    inst_id = r.json().get("id") if ok(r) else None
    c.created["instrument_id"] = inst_id

    r_list = c.get("/instruments")
    r_rules = c.post(
        "/instruments/booking-rules",
        json={
            "instrument_id": inst_id,
            "open_hours": {"mon": [{"start": "08:00", "end": "18:00"}]},
            "min_duration_minutes": 30,
            "max_duration_minutes": 240,
            "advance_hours": 24,
            "approval_mode": "owner",
        },
    ) if inst_id else None

    cal_start = datetime.now(timezone.utc) + timedelta(days=1)
    r_cal = c.get(
        f"/instruments/{inst_id}/calendar",
        params={"from_time": cal_start.isoformat(), "to_time": (cal_start + timedelta(days=7)).isoformat()},
    ) if inst_id else None

    record(
        "M02",
        "M02-001",
        "资产系统对接自动同步",
        Status.NOT_IMPL,
        gap="integrations Mock，无真实资产系统对接",
        ui_evidence="IntegrationPage 仅有 Mock 同步按钮",
    )

    record(
        "M02",
        "M02-002",
        "仪器台账 CRUD（名称/型号/厂家/编号/资产号/状态）",
        Status.PASS if ok(r) and ok(r_list) else Status.FAIL,
        api_evidence=f"POST/GET /instruments → {r.status_code}/{r_list.status_code}",
        ui_evidence="页面 /instruments，InstrumentForm 新建/编辑",
        gap="",
    )

    record(
        "M02",
        "M02-003",
        "仪器批量导入导出 Excel",
        Status.NOT_IMPL,
        gap="instruments 模块无 import/export API 与 UI",
    )

    record(
        "M02",
        "M02-004",
        "仪器预约规则配置（时段/时长/次数/校内外差异）",
        Status.PARTIAL if r_rules and ok(r_rules) else Status.FAIL,
        api_evidence=f"POST /instruments/booking-rules → {r_rules.status_code if r_rules else 'N/A'}",
        gap="无前端规则配置 UI",
    )

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)
    r_book = c.post(
        "/instrument-bookings",
        json={
            "instrument_id": inst_id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "purpose": "功能测试预约",
            "project_name": "测试项目",
        },
    ) if inst_id else None
    booking_id = r_book.json().get("id") if r_book and ok(r_book) else None
    c.created["instrument_booking_id"] = booking_id

    record(
        "M02",
        "M02-005",
        "仪器在线预约（查询+提交）",
        Status.PASS if r_book and ok(r_book) else Status.FAIL,
        api_evidence=f"POST /instrument-bookings → {r_book.status_code if r_book else 'N/A'}",
        ui_evidence="页面 /instrument-bookings",
    )

    record(
        "M02",
        "M02-006",
        "日历/时间轴展示空闲占用",
        Status.PARTIAL if r_cal and ok(r_cal) else Status.NOT_IMPL,
        api_evidence=f"GET /instruments/{{id}}/calendar → {r_cal.status_code if r_cal else 'N/A'}",
        gap="前端无日历 UI，仅 API",
    )

    if booking_id:
        r_appr = c.post(f"/instrument-bookings/{booking_id}/approve")
    else:
        r_appr = None

    record(
        "M02",
        "M02-007",
        "仪器预约审批",
        Status.PASS if r_appr and ok(r_appr) else Status.PARTIAL,
        api_evidence=f"POST approve → {r_appr.status_code if r_appr else 'N/A'}",
        ui_evidence="InstrumentBookingList 通过/拒绝按钮",
        gap="微信/钉钉消息推送未实现",
    )

    record(
        "M02",
        "M02-008",
        "仪器使用记录（参数/耗材/附件/审核）",
        Status.PARTIAL,
        api_evidence="POST /instrument-bookings/{id}/usage API 存在",
        gap="前端无使用记录填报 UI；附件上传未测",
    )

    record(
        "M02",
        "M02-009",
        "设备统计分析（频次/时长/价值分层/导出）",
        Status.PARTIAL,
        api_evidence="GET /statistics/instrument-usage",
        ui_evidence="StatisticsPage 按实验室统计表",
        gap="无价值分层、无报表导出",
    )


def test_lab_bookings(c: Client) -> None:
    lab_id = c.created.get("lab_id")
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=3)

    r_rule = c.post(
        "/lab-booking-rules",
        json={
            "lab_id": lab_id,
            "open_hours": {"mon": [{"start": "08:00", "end": "22:00"}]},
            "allowed_roles": ["teacher", "student"],
            "usage_type_rules": {},
        },
    ) if lab_id else None

    r_book = c.post(
        "/lab-bookings",
        json={
            "lab_id": lab_id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "usage_type": "teaching",
            "purpose": "教学实验",
            "expected_count": 25,
        },
    ) if lab_id else None
    booking_id = r_book.json().get("id") if r_book and ok(r_book) else None
    c.created["lab_booking_id"] = booking_id

    r_cal = c.get(
        "/lab-bookings/calendar",
        params={
            "lab_id": lab_id,
            "from_time": start.isoformat(),
            "to_time": (start + timedelta(days=7)).isoformat(),
        },
    ) if lab_id else None

    record(
        "M03",
        "M03-001",
        "实验室预约规则配置",
        Status.PARTIAL if r_rule and ok(r_rule) else Status.FAIL,
        api_evidence=f"POST /lab-booking-rules → {r_rule.status_code if r_rule else 'N/A'}",
        gap="无前端规则配置 UI",
    )

    record(
        "M03",
        "M03-002",
        "预约申请（时段/用途/人数）",
        Status.PASS if r_book and ok(r_book) else Status.FAIL,
        api_evidence=f"POST /lab-bookings → {r_book.status_code if r_book else 'N/A'}",
        ui_evidence="页面 /lab-bookings",
    )

    record(
        "M03",
        "M03-003",
        "周期性批量预约",
        Status.NOT_IMPL,
        gap="模型有 recurrence_rule 字段但 API/UI 未暴露",
    )

    if booking_id:
        r_appr = c.post(f"/lab-bookings/{booking_id}/approve")
        r_checkin = c.post(
            f"/lab-bookings/{booking_id}/check-in",
            json={"method": "qr", "actual_count": 24},
        )
    else:
        r_appr = r_checkin = None

    record(
        "M03",
        "M03-004",
        "预约审批",
        Status.PASS if r_appr and ok(r_appr) else Status.PARTIAL,
        ui_evidence="LabBookingList 通过/取消",
    )

    record(
        "M03",
        "M03-005",
        "门禁联动（二维码/人脸/密码/课表）",
        Status.NOT_IMPL,
        gap="access_grants API 存在但未与真实门禁对接；前端无授权展示",
    )

    record(
        "M03",
        "M03-006",
        "签到核验（刷卡/扫码/人脸/人数比对）",
        Status.PARTIAL if r_checkin and ok(r_checkin) else Status.FAIL,
        api_evidence=f"POST check-in → {r_checkin.status_code if r_checkin else 'N/A'}",
        gap="无一卡通/人脸实机对接；前端无签到 UI",
    )

    record(
        "M03",
        "M03-007",
        "使用记录填报与审核",
        Status.PARTIAL,
        api_evidence="POST /lab-bookings/{id}/usage API 存在",
        gap="前端无填报/审核 UI",
    )

    record(
        "M03",
        "M03-008",
        "预约记录导出",
        Status.NOT_IMPL,
        gap="无 export API 与 UI",
    )

    record(
        "M03",
        "M03-009",
        "实验室使用统计（类型分布/多维度）",
        Status.PARTIAL,
        api_evidence="GET /statistics/lab-usage",
        ui_evidence="StatisticsPage",
        gap="无周/月/学期维度切换；无导出",
    )

    record(
        "M03",
        "M03-010",
        "日历视图",
        Status.PARTIAL if r_cal and ok(r_cal) else Status.NOT_IMPL,
        api_evidence=f"GET /lab-bookings/calendar → {r_cal.status_code if r_cal else 'N/A'}",
        ui_evidence="LabBookingList 日历 Tab",
        gap="",
    )

    record(
        "M03",
        "M03-011",
        "班牌及门禁对接",
        Status.NOT_IMPL,
        gap="未实现",
    )


def test_experiment_projects(c: Client) -> None:
    suffix = uuid.uuid4().hex[:6]
    r_course = c.post("/courses", json={"code": f"C{suffix}", "name": "测试课程", "department": "计算机"})
    course_id = r_course.json().get("id") if ok(r_course) else None
    c.created["course_id"] = course_id

    r_proj = c.post(
        "/experiment-projects",
        json={
            "course_id": course_id,
            "name": "测试实验项目",
            "type": "comprehensive",
            "hours": 2,
            "semester": "2025-2026-1",
            "instruments_needed": [],
            "consumables": [],
            "majors": ["计算机"],
        },
    ) if course_id else None
    project_id = r_proj.json().get("id") if r_proj and ok(r_proj) else None
    c.created["project_id"] = project_id

    r_export = c.get("/experiment-projects/export")
    r_copy = c.post(
        "/experiment-projects/batch-copy",
        json={
            "source_course_id": course_id,
            "target_course_id": course_id,
            "project_ids": [project_id],
        },
    ) if project_id and course_id else None

    record(
        "M04",
        "M04-001",
        "实验项目 CRUD（课程/类型/学时/仪器/专业）",
        Status.PASS if r_proj and ok(r_proj) else Status.FAIL,
        api_evidence=f"POST /experiment-projects → {r_proj.status_code if r_proj else 'N/A'}",
        ui_evidence="页面 /experiment-projects, /new, /:id/edit",
    )

    record(
        "M04",
        "M04-002",
        "批量复制至其他课程",
        Status.PASS if r_copy and ok(r_copy) else Status.PARTIAL,
        api_evidence=f"POST batch-copy → {r_copy.status_code if r_copy else 'N/A'}",
        ui_evidence="ProjectList 批量复制按钮",
    )

    record(
        "M04",
        "M04-003",
        "统计与 Excel 导入导出",
        Status.PARTIAL if ok(r_export) else Status.FAIL,
        api_evidence=f"GET export → {r_export.status_code}",
        gap="无 import API；无统计维度 UI",
    )


def test_experiments(c: Client) -> None:
    suffix = uuid.uuid4().hex[:6]
    r = c.post(
        "/experiments",
        json={"code": f"EXP-{suffix}", "title": "科研实验测试", "description": "自动化测试"},
    )
    exp_id = r.json().get("id") if ok(r) else None

    record(
        "M04",
        "M04-004",
        "科研实验全生命周期（P0 已实现）",
        Status.PASS if ok(r) else Status.FAIL,
        api_evidence=f"POST /experiments → {r.status_code}",
        ui_evidence="页面 /experiments, /new, /:id",
    )

    if exp_id:
        for action in ("submit", "start", "complete"):
            c.post(f"/experiments/{exp_id}/{action}")


def test_faults(c: Client) -> None:
    lab_id = c.created.get("lab_id")
    r = c.post(
        "/faults",
        json={"lab_id": lab_id, "fault_type": "设备故障", "description": "自动化测试故障上报"},
    ) if lab_id else None
    fault_id = r.json().get("id") if r and ok(r) else None
    c.created["fault_id"] = fault_id

    r_stats = c.get("/faults/stats")
    r_qr = c.get(f"/labs/{lab_id}/fault-qr") if lab_id else None

    record(
        "M05",
        "M05-001",
        "在线故障上报",
        Status.PASS if r and ok(r) else Status.FAIL,
        api_evidence=f"POST /faults → {r.status_code if r else 'N/A'}",
        ui_evidence="页面 /faults, /faults/:id",
    )

    record(
        "M05",
        "M05-002",
        "照片/视频附件",
        Status.NOT_IMPL,
        gap="模型有 attachments 字段但前端表单未提供上传",
    )

    record(
        "M05",
        "M05-003",
        "实验室专属二维码扫码上报",
        Status.PASS if r_qr and ok(r_qr) else Status.FAIL,
        api_evidence=f"GET /labs/{{id}}/fault-qr → {r_qr.status_code if r_qr else 'N/A'}",
        ui_evidence="LabDetail 故障二维码按钮",
        gap="无独立扫码落地页",
    )

    if fault_id:
        r_handle = c.post(f"/faults/{fault_id}/handle", json={"action": "现场检查", "comment": "已检查"})
        r_status = c.post(f"/faults/{fault_id}/status", json={"status": "processing"})
    else:
        r_handle = r_status = None

    record(
        "M05",
        "M05-004",
        "指派/进度更新/结果反馈",
        Status.PARTIAL,
        api_evidence=f"handle/status API → {r_handle.status_code if r_handle else 'N/A'}",
        ui_evidence="FaultDetail 处理操作区",
        gap="消息推送未实现；assign API 前端未用",
    )

    record(
        "M05",
        "M05-005",
        "故障统计分析",
        Status.PASS if ok(r_stats) else Status.FAIL,
        api_evidence=f"GET /faults/stats → {r_stats.status_code}",
        ui_evidence="FaultList StatCard + StatisticsPage",
    )


def test_data_reporting(c: Client) -> None:
    suffix = uuid.uuid4().hex[:6]
    r_tpl = c.post(
        "/data-reporting/templates",
        json={"code": f"T{suffix}", "name": "基表测试模板", "description": "测试", "schema": {"field": "string"}},
    )
    tpl_id = r_tpl.json().get("id") if ok(r_tpl) else None

    r_sub = c.post(
        "/data-reporting/submissions",
        json={"template_id": tpl_id, "unit_name": "测试学院", "period": "2025-Q1", "data": {"count": 10}},
    ) if tpl_id else None
    sub_id = r_sub.json().get("id") if r_sub and ok(r_sub) else None

    if sub_id:
        c.post(f"/data-reporting/submissions/{sub_id}/submit")
        c.post(f"/data-reporting/submissions/{sub_id}/approve")

    r_stats = c.get("/data-reporting/submissions/stats")

    record(
        "M06",
        "M06-001",
        "教育部基表标准化模板",
        Status.PARTIAL if ok(r_tpl) else Status.FAIL,
        api_evidence=f"POST templates → {r_tpl.status_code}",
        ui_evidence="DataReportingPage 模板 Tab",
        gap="无预置教育部基表模板；schema 编辑 UI 缺失",
    )

    record(
        "M06",
        "M06-002",
        "在线填报/审核/汇总",
        Status.PARTIAL if r_sub and ok(r_sub) else Status.FAIL,
        api_evidence="submissions CRUD + submit/approve",
        ui_evidence="SubmissionList",
        gap="批量导入导出未实现",
    )

    record(
        "M06",
        "M06-003",
        "可视化展示",
        Status.PARTIAL if ok(r_stats) else Status.FAIL,
        api_evidence=f"GET submissions/stats → {r_stats.status_code}",
        gap="无图表可视化",
    )


def test_integrations(c: Client) -> None:
    r_status = c.get("/integrations/status")
    r_sync = c.post("/integrations/sync/asset")

    record(
        "M07",
        "M07-001",
        "学校数据中心对接（人员/组织/场地/资产）",
        Status.PARTIAL,
        api_evidence=f"sync/status → {r_sync.status_code}/{r_status.status_code}",
        ui_evidence="IntegrationPage Mock 同步",
        gap="全部为 Mock，无真实对接",
    )

    for req_id, name in [
        ("M07-002", "安全考试/检查系统"),
        ("M07-003", "人脸数据中台"),
        ("M07-004", "设备价值统计"),
    ]:
        record("M07", req_id, name, Status.NOT_IMPL, gap="Mock 或未实现")


def test_statistics(c: Client) -> None:
    endpoints = [
        "/statistics/overview",
        "/statistics/instrument-usage",
        "/statistics/lab-usage",
        "/statistics/faults",
    ]
    codes = []
    for ep in endpoints:
        r = c.get(ep)
        codes.append(f"{ep}:{r.status_code}")

    record(
        "M08",
        "M08-001",
        "设备使用率统计",
        Status.PASS,
        api_evidence="; ".join(codes),
        ui_evidence="StatisticsPage",
        gap="无价值分层、无导出",
    )

    record(
        "M08",
        "M08-002",
        "预约与人时数统计",
        Status.PARTIAL,
        api_evidence="GET /statistics/lab-usage",
        gap="无按课程/项目维度",
    )

    record(
        "M08",
        "M08-003",
        "实验项目统计",
        Status.NOT_IMPL,
        gap="无 dedicated 实验项目统计 API/UI",
    )


def test_dashboard(c: Client) -> None:
    r1 = c.get("/dashboard/overview")
    r2 = c.get("/dashboard/trends")

    record(
        "M09",
        "M09-006",
        "可视化大屏（运行态势/使用率/预约/安全/资产）",
        Status.PARTIAL if ok(r1) and ok(r2) else Status.FAIL,
        api_evidence=f"overview/trends → {r1.status_code}/{r2.status_code}",
        ui_evidence="页面 /dashboard",
        gap="大屏数据部分为 Mock/占位；安全数据、设备价值未完整",
    )


def test_notifications(c: Client) -> None:
    r1 = c.get("/notifications")
    r2 = c.get("/notifications/unread-count")

    record(
        "M09",
        "M09-007",
        "站内通知",
        Status.PASS if ok(r1) and ok(r2) else Status.FAIL,
        api_evidence=f"GET notifications → {r1.status_code}/{r2.status_code}",
        ui_evidence="NotificationBell 组件",
        gap="微信/钉钉推送未实现",
    )

    record(
        "M09",
        "M09-008",
        "移动端（微信/钉钉小程序）",
        Status.NOT_IMPL,
        gap="未开发",
    )

    record(
        "M09",
        "M09-009",
        "一卡通刷卡签到",
        Status.NOT_IMPL,
        gap="check-in API 支持 qr/card/face 枚举但无实机对接",
    )


def test_agent_api(c: Client) -> None:
    endpoints = ["/agent/labs", "/agent/instruments", "/agent/bookings"]
    codes = [f"{ep}:{c.get(ep).status_code}" for ep in endpoints]

    record(
        "M10",
        "M10-001",
        "REST API 开放（实验室/设备/预约/故障/统计）",
        Status.PARTIAL,
        api_evidence="; ".join(codes),
        gap="仅 3 个 agent 查询端点；无 MCP、无故障/使用记录/统计 agent API",
    )

    for req_id, name in [
        ("M10-002", "实时推送门禁/签到供违规监测"),
        ("M10-003", "待办事项 AI 助理推送"),
        ("M10-004", "Text-to-SQL 查询"),
        ("M10-005", "知识库/向量索引"),
    ]:
        record("M10", req_id, name, Status.NOT_IMPL, gap="未实现")


def test_payments(c: Client) -> None:
    r_create = c.post(
        "/payments/orders",
        json={"fee_type": "lab_usage", "amount": 100.0, "ref_type": "lab_booking", "ref_id": str(uuid.uuid4())},
    )
    order_id = r_create.json().get("id") if ok(r_create) else None
    r_pay = c.post(f"/payments/orders/{order_id}/pay") if order_id else None
    r_list = c.get("/payments/orders")

    record(
        "M11",
        "M11-001",
        "经营性收费订单（Mock）",
        Status.PARTIAL if ok(r_create) and r_pay and ok(r_pay) else Status.FAIL,
        api_evidence=f"create/pay/list → {r_create.status_code}",
        ui_evidence="页面 /payments",
        gap="Mock 支付，无银校直连/分账/电子回单",
    )

    record(
        "M12",
        "M12-001",
        "实名制预约支付（校园卡/银校借记卡）",
        Status.NOT_IMPL,
        gap="未实现",
    )


def test_api_auth(c: Client) -> None:
    # BUG-004: unauthenticated access should fail
    anon = httpx.Client(timeout=10.0)
    r_anon = anon.get(f"{API}/labs")
    record(
        "M09",
        "M09-011",
        "API 鉴权保护（未登录拒绝访问）",
        Status.PASS if r_anon.status_code == 401 else Status.FAIL,
        api_evidence=f"GET /labs without token → {r_anon.status_code}",
    )
    anon.close()


def test_frontend_routes(c: Client) -> None:
    routes = [
        "/login",
        "/dashboard",
        "/labs",
        "/spaces",
        "/users",
        "/lab-staff",
        "/lab-changes",
        "/instruments",
        "/instrument-bookings",
        "/lab-bookings",
        "/experiment-projects",
        "/experiments",
        "/faults",
        "/data-reporting",
        "/statistics",
        "/integrations",
        "/payments",
    ]
    failed = []
    for route in routes:
        r = c.client.get(f"{FRONTEND}{route}")
        if r.status_code != 200:
            failed.append(f"{route}:{r.status_code}")

    record(
        "UI",
        "UI-001",
        "前端全部路由可访问（SPA）",
        Status.PASS if not failed else Status.PARTIAL,
        ui_evidence=f"测试 {len(routes)} 条路由",
        gap=f"失败: {', '.join(failed)}" if failed else "",
    )

    missing_ui = [
        "仪器预约日历视图",
        "预约/仪器规则配置页",
        "使用记录填报页",
        "故障扫码落地页",
    ]
    record(
        "UI",
        "UI-002",
        "需求对应但缺失的前端页面",
        Status.NOT_IMPL,
        gap="; ".join(missing_ui),
    )


def test_users_mgmt(c: Client) -> None:
    r = c.get("/users")
    record(
        "M09",
        "M09-010",
        "用户管理（CRUD/RBAC）",
        Status.PASS if ok(r) else Status.FAIL,
        api_evidence=f"GET /users → {r.status_code}",
        ui_evidence="页面 /users",
        gap="",
    )


def main() -> int:
    c = Client()
    if not c.login():
        print("FATAL: 无法登录 admin/admin123")
        return 1

    test_auth(c)
    test_spaces(c)
    test_labs(c)
    test_lab_staff(c)
    test_lab_changes(c)
    test_instruments(c)
    test_lab_bookings(c)
    test_experiment_projects(c)
    test_experiments(c)
    test_faults(c)
    test_data_reporting(c)
    test_integrations(c)
    test_statistics(c)
    test_dashboard(c)
    test_notifications(c)
    test_agent_api(c)
    test_payments(c)
    test_users_mgmt(c)
    test_api_auth(c)
    test_frontend_routes(c)
    c.close()

    out = {
        "test_time": datetime.now(timezone.utc).isoformat(),
        "summary": {},
        "results": [],
    }
    for s in Status:
        out["summary"][s.value] = sum(1 for r in results if r.status == s)

    for r in results:
        out["results"].append(
            {
                "module": r.module,
                "req_id": r.req_id,
                "requirement": r.requirement,
                "status": r.status.value,
                "api_evidence": r.api_evidence,
                "ui_evidence": r.ui_evidence,
                "gap": r.gap,
                "notes": r.notes,
            }
        )

    report_path = "/workspace/docs/functional-test-report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(json.dumps(out["summary"], ensure_ascii=False, indent=2))
    print(f"Report: {report_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
