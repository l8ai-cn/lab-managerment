from fastapi import APIRouter

from src.modules.faults.router import lab_qr_router, router


def get_routers() -> list[tuple[APIRouter, str]]:
    return [
        (router, ""),
        (lab_qr_router, ""),
    ]
