import os
from pathlib import Path

from pydantic_settings import BaseSettings

# 默认 SQLite，无需 Docker 即可本地运行
_DEFAULT_SQLITE = f"sqlite+aiosqlite:///{Path(__file__).resolve().parents[2] / 'data' / 'lab_management.db'}"


class Settings(BaseSettings):
    app_name: str = "实验室管理系统"
    debug: bool = True
    database_url: str = os.getenv("DATABASE_URL", _DEFAULT_SQLITE)
    api_v1_prefix: str = "/api/v1"
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
