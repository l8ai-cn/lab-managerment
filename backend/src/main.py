from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.database import async_session_factory
from src.modules.agent_api import get_routers as agent_api_routers
from src.modules.dashboard import get_routers as dashboard_routers
from src.modules.data_reporting import get_routers as data_reporting_routers
from src.modules.experiment_projects import get_routers as experiment_projects_routers
from src.modules.experiments.router import router as experiments_router
from src.modules.faults import get_routers as faults_routers
from src.modules.integrations import get_routers as integrations_routers
from src.modules.instruments import get_routers as instruments_routers
from src.modules.lab_bookings import get_routers as lab_bookings_routers
from src.modules.lab_changes.router import router as lab_changes_router
from src.modules.lab_staff.router import router as lab_staff_router
from src.modules.labs.router import router as labs_router
from src.modules.notifications import get_routers as notifications_routers
from src.modules.payments import get_routers as payments_routers
from src.modules.spaces.router import router as spaces_router
from src.modules.statistics import get_routers as statistics_routers
from src.modules.users.router import router as auth_router
from src.modules.users.router import users_router
from src.modules.users.service import UserService


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session_factory() as session:
        await UserService(session).ensure_admin_exists()
    yield


def _register_module_routers(app: FastAPI, get_routers_fn) -> None:
    for router, prefix in get_routers_fn():
        app.include_router(router, prefix=settings.api_v1_prefix + prefix)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.3.0",
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

    for get_routers_fn in (
        instruments_routers,
        lab_bookings_routers,
        experiment_projects_routers,
        faults_routers,
        data_reporting_routers,
        statistics_routers,
        dashboard_routers,
        integrations_routers,
        payments_routers,
        notifications_routers,
        agent_api_routers,
    ):
        _register_module_routers(app, get_routers_fn)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
