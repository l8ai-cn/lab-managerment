import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BuildingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    address: str | None = Field(None, max_length=300)
    sort_order: int = 0


class BuildingCreate(BuildingBase):
    pass


class BuildingUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = Field(None, min_length=1, max_length=20)
    address: str | None = None
    sort_order: int | None = None


class BuildingResponse(BuildingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class FloorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    floor_number: int
    sort_order: int = 0


class FloorCreate(FloorBase):
    building_id: uuid.UUID


class FloorUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    floor_number: int | None = None
    sort_order: int | None = None


class FloorResponse(FloorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    building_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str | None = Field(None, max_length=20)
    area_sqm: float | None = None
    room_type: str | None = Field(None, max_length=50)


class RoomCreate(RoomBase):
    floor_id: uuid.UUID


class RoomUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    code: str | None = None
    area_sqm: float | None = None
    room_type: str | None = None


class RoomResponse(RoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    floor_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BuildingTreeResponse(BuildingResponse):
    floors: list["FloorTreeResponse"] = []


class FloorTreeResponse(FloorResponse):
    rooms: list[RoomResponse] = []
