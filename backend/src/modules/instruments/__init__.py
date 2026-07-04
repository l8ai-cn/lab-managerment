from fastapi import APIRouter

from src.modules.instruments.router import bookings_router, router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [
        (router, ""),
        (bookings_router, ""),
    ]
