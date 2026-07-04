from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.database import async_session_factory
from src.modules.experiments.router import router as experiments_router
from src.modules.lab_changes.router import router as lab_changes_router
from src.modules.lab_staff.router import router as lab_staff_router
from src.modules.labs.router import router as labs_router
from src.modules.spaces.router import router as spaces_router
from src.modules.users.router import router as auth_router
from src.modules.users.router import users_router
from src.modules.users.service import UserService


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session_factory() as session:
        await UserService(session).ensure_admin_exists()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix)
    app.include_router(spaces_router, prefix=settings.api_v1_prefix)
    app.include_router(labs_router, prefix=settings.api_v1_prefix)
    app.include_router(lab_staff_router, prefix=settings.api_v1_prefix)
    app.include_router(lab_changes_router, prefix=settings.api_v1_prefix)
    app.include_router(experiments_router, prefix=settings.api_v1_prefix)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
