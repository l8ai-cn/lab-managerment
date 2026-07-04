import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.modules.spaces.models import Building, Floor, Room


class SpaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Building ---

    async def list_buildings(self) -> list[Building]:
        result = await self.db.execute(
            select(Building)
            .where(Building.deleted_at.is_(None))
            .order_by(Building.sort_order, Building.name)
        )
        return list(result.scalars().all())

    async def get_building(self, building_id: uuid.UUID) -> Building | None:
        result = await self.db.execute(
            select(Building).where(Building.id == building_id, Building.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_building_tree(self) -> list[Building]:
        result = await self.db.execute(
            select(Building)
            .where(Building.deleted_at.is_(None))
            .options(
                selectinload(Building.floors).selectinload(Floor.rooms),
            )
            .order_by(Building.sort_order, Building.name)
        )
        return list(result.scalars().all())

    async def create_building(self, building: Building) -> Building:
        self.db.add(building)
        await self.db.flush()
        await self.db.refresh(building)
        return building

    async def get_floor(self, floor_id: uuid.UUID) -> Floor | None:
        result = await self.db.execute(
            select(Floor).where(Floor.id == floor_id, Floor.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_floors(self, building_id: uuid.UUID) -> list[Floor]:
        result = await self.db.execute(
            select(Floor)
            .where(Floor.building_id == building_id, Floor.deleted_at.is_(None))
            .order_by(Floor.sort_order, Floor.floor_number)
        )
        return list(result.scalars().all())

    async def create_floor(self, floor: Floor) -> Floor:
        self.db.add(floor)
        await self.db.flush()
        await self.db.refresh(floor)
        return floor

    async def get_room(self, room_id: uuid.UUID) -> Room | None:
        result = await self.db.execute(
            select(Room).where(Room.id == room_id, Room.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_rooms(self, floor_id: uuid.UUID) -> list[Room]:
        result = await self.db.execute(
            select(Room)
            .where(Room.floor_id == floor_id, Room.deleted_at.is_(None))
            .order_by(Room.name)
        )
        return list(result.scalars().all())

    async def create_room(self, room: Room) -> Room:
        self.db.add(room)
        await self.db.flush()
        await self.db.refresh(room)
        return room

    async def find_room_by_location(
        self, building_name: str, floor_number: int, room_code: str | None = None
    ) -> Room | None:
        query = (
            select(Room)
            .join(Floor, Room.floor_id == Floor.id)
            .join(Building, Floor.building_id == Building.id)
            .where(
                Building.name == building_name,
                Floor.floor_number == floor_number,
                Building.deleted_at.is_(None),
                Floor.deleted_at.is_(None),
                Room.deleted_at.is_(None),
            )
        )
        if room_code:
            query = query.where(Room.code == room_code)
        result = await self.db.execute(query.limit(1))
        return result.scalar_one_or_none()

    async def soft_delete(self, entity) -> None:
        entity.deleted_at = datetime.now(tz=datetime.now().astimezone().tzinfo)
        await self.db.flush()
