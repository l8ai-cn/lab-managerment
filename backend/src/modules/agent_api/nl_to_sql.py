"""Rule-based natural language to SQL for common LabOS queries."""

from __future__ import annotations

import re

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"(有多少|几个|数量|总数).*(实验室|实验楼)"), "SELECT COUNT(*) AS lab_count FROM labs"),
    (re.compile(r"(有多少|几个|数量|总数).*(仪器|设备)"), "SELECT COUNT(*) AS instrument_count FROM instruments WHERE deleted_at IS NULL"),
    (re.compile(r"(有多少|几个|数量|总数).*(用户|人员)"), "SELECT COUNT(*) AS user_count FROM users"),
    (re.compile(r"(有多少|几个|数量|总数).*(故障|报修)"), "SELECT COUNT(*) AS fault_count FROM fault_reports"),
    (re.compile(r"(有多少|几个|数量|总数).*(预约)"), "SELECT (SELECT COUNT(*) FROM lab_bookings) AS lab_bookings, (SELECT COUNT(*) FROM instrument_bookings) AS instrument_bookings"),
    (re.compile(r"(列出|查询|显示|所有|全部).*(实验室)"), "SELECT id, code, name, open_status FROM labs ORDER BY code LIMIT 50"),
    (re.compile(r"(列出|查询|显示|所有|全部).*(仪器|设备)"), "SELECT id, code, name, category, status FROM instruments WHERE deleted_at IS NULL ORDER BY code LIMIT 50"),
    (re.compile(r"(列出|查询|显示|所有|全部).*(用户)"), "SELECT id, username, name, role FROM users ORDER BY username LIMIT 50"),
    (re.compile(r"(列出|查询|显示|所有|全部).*(故障)"), "SELECT id, fault_type, status, description FROM fault_reports ORDER BY created_at DESC LIMIT 50"),
    (re.compile(r"(待处理|未处理).*(故障)"), "SELECT id, fault_type, status FROM fault_reports WHERE status IN ('pending','assigned','processing') LIMIT 50"),
    (re.compile(r"(待审批|未审批).*(预约)"), "SELECT id, lab_id, start_time, status FROM lab_bookings WHERE status = 'pending' LIMIT 50"),
    (re.compile(r"(开放|可用).*(实验室)"), "SELECT id, code, name FROM labs WHERE open_status = 'open' LIMIT 50"),
]


def nl_to_sql(question: str) -> str | None:
    q = question.strip()
    if not q:
        return None
    for pattern, sql in _PATTERNS:
        if pattern.search(q):
            return sql
    return None
