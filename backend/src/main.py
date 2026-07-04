from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.modules.experiments.router import router as experiments_router
from src.modules.labs.router import router as labs_router
from src.modules.spaces.router import router as spaces_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(spaces_router, prefix=settings.api_v1_prefix)
    app.include_router(labs_router, prefix=settings.api_v1_prefix)
    app.include_router(experiments_router, prefix=settings.api_v1_prefix)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
