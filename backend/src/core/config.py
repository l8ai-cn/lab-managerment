from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "实验室管理系统"
    debug: bool = True
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lab_management"
    api_v1_prefix: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
