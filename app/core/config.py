"""应用配置。

通过环境变量或 `.env` 文件覆盖默认值,前缀为 ``LAB_``。
例如设置数据库地址:``LAB_DATABASE_URL=postgresql+psycopg://...``。
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="LAB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 应用元信息
    app_name: str = "实验管理业务系统"
    app_description: str = "一套用于管理实验全生命周期的业务系统模块"
    version: str = "0.1.0"
    debug: bool = False

    # 数据库
    database_url: str = "sqlite:///./lab_management.db"

    # 分页默认值
    default_page_size: int = 20
    max_page_size: int = 100


@lru_cache
def get_settings() -> Settings:
    """返回全局唯一的配置实例(带缓存)。"""

    return Settings()


settings = get_settings()
