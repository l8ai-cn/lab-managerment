"""FastAPI 应用入口。"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.api.routers import experiments
from app.core.config import settings
from app.core.database import init_db
from app.exceptions import (
    ConflictError,
    InvalidStateTransitionError,
    NotFoundError,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 开发 / 演示环境下自动建表;生产环境应改用迁移工具。
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.version,
        lifespan=lifespan,
    )

    _register_exception_handlers(app)

    app.include_router(experiments.router, prefix="/api/v1")

    @app.get("/health", tags=["系统"], summary="健康检查")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def _handle_not_found(request: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ConflictError)
    async def _handle_conflict(request: Request, exc: ConflictError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc)},
        )

    @app.exception_handler(InvalidStateTransitionError)
    async def _handle_invalid_transition(
        request: Request, exc: InvalidStateTransitionError
    ):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": str(exc)},
        )


app = create_app()
