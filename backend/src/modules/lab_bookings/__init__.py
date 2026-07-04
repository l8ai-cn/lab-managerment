from fastapi import APIRouter

from src.modules.lab_bookings.router import router, rules_router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [
        (router, ""),
        (rules_router, ""),
    ]
