"""领域异常定义。

服务层抛出这些与框架无关的异常,由 API 层统一转换为 HTTP 响应。
"""

from __future__ import annotations


class DomainError(Exception):
    """领域层通用异常基类。"""


class NotFoundError(DomainError):
    """请求的资源不存在。"""


class ConflictError(DomainError):
    """资源冲突,例如唯一约束冲突。"""


class InvalidStateTransitionError(DomainError):
    """非法的状态流转。"""
