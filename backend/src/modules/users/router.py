import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.users.models import User, UserRole
from src.modules.users.schemas import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from src.modules.users.service import UserService

router = APIRouter(prefix="/auth", tags=["认证与用户"])


def get_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, service: UserService = Depends(get_service)):
    return await service.login(data)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


users_router = APIRouter(prefix="/users", tags=["用户管理"])


@users_router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: UserRole | None = None,
    keyword: str | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: UserService = Depends(get_service),
):
    return await service.list(page=page, page_size=page_size, role=role, keyword=keyword, is_active=is_active)


@users_router.post("", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
    service: UserService = Depends(get_service),
):
    return await service.create(data)


@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.DEPT_ADMIN)),
    service: UserService = Depends(get_service),
):
    return await service.get(user_id)


@users_router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
    service: UserService = Depends(get_service),
):
    return await service.update(user_id, data)
