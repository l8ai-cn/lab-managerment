"""通用 Schema:分页等。"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
    """分页元信息。"""

    total: int
    page: int
    page_size: int
    pages: int


class Page(BaseModel, Generic[T]):
    """通用分页响应容器。"""

    items: list[T]
    meta: PageMeta

    @classmethod
    def create(
        cls, items: list[T], total: int, page: int, page_size: int
    ) -> "Page[T]":
        pages = (total + page_size - 1) // page_size if page_size else 0
        return cls(
            items=items,
            meta=PageMeta(
                total=total, page=page, page_size=page_size, pages=pages
            ),
        )
