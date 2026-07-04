"""重置数据库并重新种子 — 运行: python -m scripts.reset_and_seed"""

import asyncio
from pathlib import Path

from src.core.config import settings
from src.core.database import engine


async def reset_and_seed():
    if settings.is_sqlite:
        db_path = settings.database_url.split("///")[-1]
        path = Path(db_path)
        if path.exists():
            path.unlink()
            print(f"已删除数据库: {path}")
    else:
        from src.core.database import Base
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
            await conn.run_sync(Base.metadata.drop_all)
        print("已清空所有表")

    await engine.dispose()

    from scripts.seed_full_platform import seed

    await seed()


if __name__ == "__main__":
    asyncio.run(reset_and_seed())
