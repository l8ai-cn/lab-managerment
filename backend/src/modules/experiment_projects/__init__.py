from fastapi import APIRouter

from src.modules.experiment_projects.router import courses_router, router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [
        (courses_router, ""),
        (router, ""),
    ]
