"""实验管理领域中的枚举定义。"""

from __future__ import annotations

from enum import Enum


class ExperimentStatus(str, Enum):
    """实验生命周期状态。"""

    DRAFT = "draft"  # 草稿:刚创建,尚未排期
    SCHEDULED = "scheduled"  # 已排期:已计划开始/结束时间
    IN_PROGRESS = "in_progress"  # 进行中
    COMPLETED = "completed"  # 已完成
    CANCELLED = "cancelled"  # 已取消
    ARCHIVED = "archived"  # 已归档


class ExperimentPriority(str, Enum):
    """实验优先级。"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RecordType(str, Enum):
    """实验记录类型。"""

    NOTE = "note"  # 备注
    OBSERVATION = "observation"  # 观察
    RESULT = "result"  # 结果
    ISSUE = "issue"  # 问题 / 异常


# 允许的状态流转关系(状态机)。
# key 为当前状态,value 为允许转换到的目标状态集合。
ALLOWED_STATUS_TRANSITIONS: dict[ExperimentStatus, set[ExperimentStatus]] = {
    ExperimentStatus.DRAFT: {
        ExperimentStatus.SCHEDULED,
        ExperimentStatus.IN_PROGRESS,
        ExperimentStatus.CANCELLED,
    },
    ExperimentStatus.SCHEDULED: {
        ExperimentStatus.IN_PROGRESS,
        ExperimentStatus.CANCELLED,
        ExperimentStatus.DRAFT,
    },
    ExperimentStatus.IN_PROGRESS: {
        ExperimentStatus.COMPLETED,
        ExperimentStatus.CANCELLED,
    },
    ExperimentStatus.COMPLETED: {
        ExperimentStatus.ARCHIVED,
    },
    ExperimentStatus.CANCELLED: {
        ExperimentStatus.ARCHIVED,
        ExperimentStatus.DRAFT,
    },
    ExperimentStatus.ARCHIVED: set(),  # 归档为终态
}


def can_transition(
    current: ExperimentStatus, target: ExperimentStatus
) -> bool:
    """判断实验状态是否允许从 ``current`` 流转到 ``target``。"""

    if current == target:
        return True
    return target in ALLOWED_STATUS_TRANSITIONS.get(current, set())
