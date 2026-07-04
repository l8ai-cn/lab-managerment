from fastapi import APIRouter

from src.modules.payments.router import router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [(router, "")]
