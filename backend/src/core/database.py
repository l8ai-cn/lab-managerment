from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

_connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=_connect_args,
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_database() -> None:
    """SQLite 开发模式：自动建表"""
    if not settings.is_sqlite:
        return
    from pathlib import Path

    db_path = settings.database_url.split("///")[-1]
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    import src.modules.access_control.models  # noqa: F401
    import src.modules.data_reporting.models  # noqa: F401
    import src.modules.experiment_projects.models  # noqa: F401
    import src.modules.experiments.models  # noqa: F401
    import src.modules.faults.models  # noqa: F401
    import src.modules.integrations.models  # noqa: F401
    import src.modules.instruments.models  # noqa: F401
    import src.modules.knowledge.models  # noqa: F401
    import src.modules.lab_bookings.models  # noqa: F401
    import src.modules.lab_changes.models  # noqa: F401
    import src.modules.lab_staff.models  # noqa: F401
    import src.modules.labs.models  # noqa: F401
    import src.modules.payments.models  # noqa: F401
    import src.modules.spaces.models  # noqa: F401
    import src.modules.users.models  # noqa: F401
    import src.shared.notifications  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
