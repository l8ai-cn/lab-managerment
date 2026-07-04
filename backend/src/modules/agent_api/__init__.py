from fastapi import APIRouter

from src.modules.agent_api.router import router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [(router, "")]
