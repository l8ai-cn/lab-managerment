from fastapi import APIRouter

from src.modules.data_reporting.router import router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [(router, "")]
