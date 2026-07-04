import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.users.models import UserRole


class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    employee_no: str | None = Field(None, max_length=30)
    phone: str | None = Field(None, max_length=20)
    role: UserRole = UserRole.TEACHER
    department: str | None = Field(None, max_length=200)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    employee_no: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    department: str | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=6, max_length=100)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    created_at: datetime


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
