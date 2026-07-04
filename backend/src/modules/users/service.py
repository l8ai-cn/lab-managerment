import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import create_access_token, hash_password, verify_password
from src.modules.users.models import User
from src.modules.users.repository import UserRepository
from src.modules.users.schemas import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)
        self.db = db

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.get_by_username(data.username)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已禁用")
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

    async def create(self, data: UserCreate) -> UserResponse:
        existing = await self.repo.get_by_username(data.username)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
        user = User(
            username=data.username.strip().lower(),
            password_hash=hash_password(data.password),
            name=data.name,
            employee_no=data.employee_no,
            phone=data.phone,
            role=data.role,
            department=data.department,
        )
        created = await self.repo.create(user)
        await self.db.commit()
        return UserResponse.model_validate(created)

    async def get(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
        return UserResponse.model_validate(user)

    async def list(
        self, *, page: int = 1, page_size: int = 20, role=None, keyword: str | None = None, is_active: bool | None = None
    ) -> UserListResponse:
        items, total = await self.repo.list_users(
            page=page, page_size=page_size, role=role, keyword=keyword, is_active=is_active
        )
        return UserListResponse(
            items=[UserResponse.model_validate(u) for u in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(self, user_id: uuid.UUID, data: UserUpdate) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
        update_data = data.model_dump(exclude_unset=True)
        if "password" in update_data:
            user.password_hash = hash_password(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(user, field, value)
        updated = await self.repo.update(user)
        await self.db.commit()
        return UserResponse.model_validate(updated)

    async def ensure_admin_exists(self) -> None:
        admin = await self.repo.get_by_username("admin")
        if not admin:
            from src.modules.users.models import UserRole

            await self.create(
                UserCreate(
                    username="admin",
                    password="admin123",
                    name="系统管理员",
                    role=UserRole.SYSTEM_ADMIN,
                )
            )
