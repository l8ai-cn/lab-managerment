import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.spaces.models import Building, Floor, Room
from src.modules.spaces.repository import SpaceRepository
from src.modules.spaces.schemas import (
    BuildingCreate,
    BuildingResponse,
    BuildingTreeResponse,
    BuildingUpdate,
    FloorCreate,
    FloorResponse,
    FloorTreeResponse,
    FloorUpdate,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)


class SpaceService:
    def __init__(self, db: AsyncSession):
        self.repo = SpaceRepository(db)
        self.db = db

    async def list_buildings(self) -> list[BuildingResponse]:
        buildings = await self.repo.list_buildings()
        return [BuildingResponse.model_validate(b) for b in buildings]

    async def get_building_tree(self) -> list[BuildingTreeResponse]:
        buildings = await self.repo.get_building_tree()
        return [
            BuildingTreeResponse(
                **BuildingResponse.model_validate(b).model_dump(),
                floors=[
                    FloorTreeResponse(
                        **FloorResponse.model_validate(f).model_dump(),
                        rooms=[RoomResponse.model_validate(r) for r in f.rooms if not r.deleted_at],
                    )
                    for f in b.floors
                    if not f.deleted_at
                ],
            )
            for b in buildings
        ]

    async def create_building(self, data: BuildingCreate) -> BuildingResponse:
        building = Building(**data.model_dump())
        created = await self.repo.create_building(building)
        await self.db.commit()
        return BuildingResponse.model_validate(created)

    async def update_building(
        self, building_id: uuid.UUID, data: BuildingUpdate
    ) -> BuildingResponse:
        building = await self.repo.get_building(building_id)
        if not building:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼栋不存在")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(building, field, value)
        await self.db.commit()
        await self.db.refresh(building)
        return BuildingResponse.model_validate(building)

    async def create_floor(self, data: FloorCreate) -> FloorResponse:
        building = await self.repo.get_building(data.building_id)
        if not building:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼栋不存在")
        floor = Floor(**data.model_dump())
        created = await self.repo.create_floor(floor)
        await self.db.commit()
        return FloorResponse.model_validate(created)

    async def list_floors(self, building_id: uuid.UUID) -> list[FloorResponse]:
        floors = await self.repo.list_floors(building_id)
        return [FloorResponse.model_validate(f) for f in floors]

    async def create_room(self, data: RoomCreate) -> RoomResponse:
        floor = await self.repo.get_floor(data.floor_id)
        if not floor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼层不存在")
        room = Room(**data.model_dump())
        created = await self.repo.create_room(room)
        await self.db.commit()
        return RoomResponse.model_validate(created)

    async def list_rooms(self, floor_id: uuid.UUID) -> list[RoomResponse]:
        rooms = await self.repo.list_rooms(floor_id)
        return [RoomResponse.model_validate(r) for r in rooms]

    async def update_room(self, room_id: uuid.UUID, data: RoomUpdate) -> RoomResponse:
        room = await self.repo.get_room(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="房间不存在")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(room, field, value)
        await self.db.commit()
        await self.db.refresh(room)
        return RoomResponse.model_validate(room)

    async def update_floor(self, floor_id: uuid.UUID, data: FloorUpdate) -> FloorResponse:
        floor = await self.repo.get_floor(floor_id)
        if not floor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼层不存在")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(floor, field, value)
        await self.db.commit()
        await self.db.refresh(floor)
        return FloorResponse.model_validate(floor)

    async def delete_building(self, building_id: uuid.UUID) -> None:
        building = await self.repo.get_building(building_id)
        if not building:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼栋不存在")
        await self.repo.soft_delete(building)
        await self.db.commit()

    async def delete_floor(self, floor_id: uuid.UUID) -> None:
        floor = await self.repo.get_floor(floor_id)
        if not floor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="楼层不存在")
        await self.repo.soft_delete(floor)
        await self.db.commit()

    async def delete_room(self, room_id: uuid.UUID) -> None:
        room = await self.repo.get_room(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="房间不存在")
        await self.repo.soft_delete(room)
        await self.db.commit()
