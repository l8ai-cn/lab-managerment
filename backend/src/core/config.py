from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "实验室管理系统"
    debug: bool = True
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lab_management"
    api_v1_prefix: str = "/api/v1"
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
