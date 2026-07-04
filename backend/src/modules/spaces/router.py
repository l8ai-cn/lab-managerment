import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.modules.spaces.schemas import (
    BuildingCreate,
    BuildingResponse,
    BuildingTreeResponse,
    BuildingUpdate,
    FloorCreate,
    FloorResponse,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from src.modules.spaces.service import SpaceService

router = APIRouter(tags=["空间管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> SpaceService:
    return SpaceService(db)


@router.get("/buildings", response_model=list[BuildingResponse])
async def list_buildings(service: SpaceService = Depends(get_service)):
    return await service.list_buildings()


@router.get("/buildings/tree", response_model=list[BuildingTreeResponse])
async def get_building_tree(service: SpaceService = Depends(get_service)):
    return await service.get_building_tree()


@router.post("/buildings", response_model=BuildingResponse)
async def create_building(data: BuildingCreate, service: SpaceService = Depends(get_service)):
    return await service.create_building(data)


@router.patch("/buildings/{building_id}", response_model=BuildingResponse)
async def update_building(
    building_id: uuid.UUID, data: BuildingUpdate, service: SpaceService = Depends(get_service)
):
    return await service.update_building(building_id, data)


@router.get("/buildings/{building_id}/floors", response_model=list[FloorResponse])
async def list_floors(building_id: uuid.UUID, service: SpaceService = Depends(get_service)):
    return await service.list_floors(building_id)


@router.post("/floors", response_model=FloorResponse)
async def create_floor(data: FloorCreate, service: SpaceService = Depends(get_service)):
    return await service.create_floor(data)


@router.get("/floors/{floor_id}/rooms", response_model=list[RoomResponse])
async def list_rooms(floor_id: uuid.UUID, service: SpaceService = Depends(get_service)):
    return await service.list_rooms(floor_id)


@router.post("/rooms", response_model=RoomResponse)
async def create_room(data: RoomCreate, service: SpaceService = Depends(get_service)):
    return await service.create_room(data)


@router.patch("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: uuid.UUID, data: RoomUpdate, service: SpaceService = Depends(get_service)
):
    return await service.update_room(room_id, data)
