import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.spaces.schemas import (
    BuildingCreate,
    BuildingResponse,
    BuildingTreeResponse,
    BuildingUpdate,
    FloorCreate,
    FloorResponse,
    FloorUpdate,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from src.modules.spaces.service import SpaceService
from src.modules.users.models import User, UserRole

router = APIRouter(tags=["空间管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> SpaceService:
    return SpaceService(db)


@router.get("/buildings", response_model=list[BuildingResponse])
async def list_buildings(
    _: User = Depends(get_current_user),
    service: SpaceService = Depends(get_service),
):
    return await service.list_buildings()


@router.get("/buildings/tree", response_model=list[BuildingTreeResponse])
async def get_building_tree(
    _: User = Depends(get_current_user),
    service: SpaceService = Depends(get_service),
):
    return await service.get_building_tree()


@router.post("/buildings", response_model=BuildingResponse)
async def create_building(
    data: BuildingCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.create_building(data)


@router.patch("/buildings/{building_id}", response_model=BuildingResponse)
async def update_building(
    building_id: uuid.UUID,
    data: BuildingUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.update_building(building_id, data)


@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_building(
    building_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    await service.delete_building(building_id)


@router.get("/buildings/{building_id}/floors", response_model=list[FloorResponse])
async def list_floors(
    building_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: SpaceService = Depends(get_service),
):
    return await service.list_floors(building_id)


@router.post("/floors", response_model=FloorResponse)
async def create_floor(
    data: FloorCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.create_floor(data)


@router.patch("/floors/{floor_id}", response_model=FloorResponse)
async def update_floor(
    floor_id: uuid.UUID,
    data: FloorUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.update_floor(floor_id, data)


@router.delete("/floors/{floor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_floor(
    floor_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    await service.delete_floor(floor_id)


@router.get("/floors/{floor_id}/rooms", response_model=list[RoomResponse])
async def list_rooms(
    floor_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: SpaceService = Depends(get_service),
):
    return await service.list_rooms(floor_id)


@router.post("/rooms", response_model=RoomResponse)
async def create_room(
    data: RoomCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN, UserRole.LAB_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.create_room(data)


@router.patch("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: uuid.UUID,
    data: RoomUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN, UserRole.LAB_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    return await service.update_room(room_id, data)


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN, UserRole.LAB_ADMIN)),
    service: SpaceService = Depends(get_service),
):
    await service.delete_room(room_id)
