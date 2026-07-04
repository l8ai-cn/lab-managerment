from fastapi import APIRouter

from src.modules.access_control.router import router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [(router, "")]
