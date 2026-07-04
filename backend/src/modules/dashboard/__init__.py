from fastapi import APIRouter

from src.modules.dashboard.router import router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [(router, "")]
