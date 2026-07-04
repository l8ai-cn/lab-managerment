"""pytest 公共 fixtures。

使用内存 SQLite 数据库,保证测试相互隔离且不落盘。
"""

from __future__ import annotations

import os

# 在导入应用前将全局数据库指向内存,避免测试产生落盘文件。
os.environ.setdefault("LAB_DATABASE_URL", "sqlite://")

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import create_app


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    # 确保所有模型已注册。
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    app = create_app()

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    # 覆盖了 get_db,无需 lifespan 建表,直接使用 TestClient。
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
