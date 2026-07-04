"""Shared booking rule validation for lab and instrument reservations."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status

from src.modules.users.models import User, UserRole

WEEKDAY_KEYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def _day_key(dt: datetime) -> str:
    return WEEKDAY_KEYS[dt.weekday()]


def _parse_hm(value: str) -> tuple[int, int]:
    parts = value.strip().split(":")
    return int(parts[0]), int(parts[1])


def _local_time(dt: datetime) -> tuple[int, int]:
    local = dt.astimezone() if dt.tzinfo else dt.replace(tzinfo=UTC)
    return local.hour, local.minute


def _minutes_since_midnight(h: int, m: int) -> int:
    return h * 60 + m


def _slot_minutes(start: str, end: str) -> tuple[int, int]:
    sh, sm = _parse_hm(start)
    eh, em = _parse_hm(end)
    return _minutes_since_midnight(sh, sm), _minutes_since_midnight(eh, em)


def validate_open_hours(open_hours: dict | None, start: datetime, end: datetime) -> None:
    if not open_hours:
        return
    configured_days = [k for k in WEEKDAY_KEYS if open_hours.get(k)]
    if not configured_days:
        return

    day = _day_key(start)
    slots = open_hours.get(day) or []
    if not slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{day} 不在开放时段内",
        )

    start_m = _minutes_since_midnight(*_local_time(start))
    end_m = _minutes_since_midnight(*_local_time(end))
    for slot in slots:
        slot_start, slot_end = _slot_minutes(slot["start"], slot["end"])
        if start_m >= slot_start and end_m <= slot_end:
            return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="预约时段不在开放时间内",
    )


def validate_allowed_roles(allowed_roles: list | None, user: User) -> None:
    if user.role in (UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.DEPT_ADMIN):
        return
    if not allowed_roles:
        return
    if user.role.value not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"角色 {user.role.value} 不允许预约此实验室",
        )


def validate_daily_limit(current_count: int, limit: int | None, label: str = "每日") -> None:
    if limit is not None and current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"已达{label}预约上限 ({limit})",
        )


def validate_duration_minutes(start: datetime, end: datetime, min_min: int | None, max_min: int | None) -> None:
    duration = int((end - start).total_seconds() / 60)
    if min_min is not None and duration < min_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"预约时长不得少于 {min_min} 分钟（当前 {duration} 分钟）",
        )
    if max_min is not None and duration > max_min:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"预约时长不得超过 {max_min} 分钟（当前 {duration} 分钟）",
        )


def validate_advance_hours(start: datetime, advance_hours: int | None) -> None:
    if advance_hours is None:
        return
    now = datetime.now(UTC)
    if start.tzinfo is None:
        start = start.replace(tzinfo=UTC)
    earliest = now + timedelta(hours=advance_hours)
    if start < earliest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"需提前 {advance_hours} 小时预约",
        )


def resolve_lab_type_rules(usage_type_rules: dict | None, usage_type: str) -> dict[str, Any]:
    if not usage_type_rules:
        return {}
    return usage_type_rules.get(usage_type) or {}


def resolve_instrument_user_rules(rule, user: User) -> dict[str, Any]:
    if user.role == UserRole.GUEST:
        return rule.external_rules or {}
    return rule.internal_rules or {}


def should_auto_approve_lab(usage_type_rules: dict | None, usage_type: str) -> bool:
    type_rule = resolve_lab_type_rules(usage_type_rules, usage_type)
    return type_rule.get("require_approval") is False


def should_auto_approve_instrument(rule, user: User) -> bool:
    if rule.approval_mode == "auto":
        return True
    user_rules = resolve_instrument_user_rules(rule, user)
    return user_rules.get("require_approval") is False


def day_bounds(dt: datetime) -> tuple[datetime, datetime]:
    local = dt.astimezone(UTC) if dt.tzinfo else dt.replace(tzinfo=UTC)
    start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def week_bounds(dt: datetime) -> tuple[datetime, datetime]:
    local = dt.astimezone(UTC) if dt.tzinfo else dt.replace(tzinfo=UTC)
    monday = local - timedelta(days=local.weekday())
    start = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=7)
    return start, end
