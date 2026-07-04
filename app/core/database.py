"""数据库引擎与会话管理。"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """所有 ORM 模型的声明式基类。"""


def _build_engine(database_url: str):
    # SQLite 在多线程(如 TestClient / uvicorn 工作线程)下需要放开线程检查。
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(database_url, connect_args=connect_args, future=True)


engine = _build_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖:提供一个请求级别的数据库会话。"""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """创建所有表(仅用于开发 / 演示;生产环境应使用迁移工具)。"""

    # 确保模型已被导入并注册到元数据上。
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
