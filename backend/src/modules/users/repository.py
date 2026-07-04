import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.users.models import User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username.strip().lower())
        )
        return result.scalar_one_or_none()

    async def list_users(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        role: UserRole | None = None,
        keyword: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[User], int]:
        query = select(User)
        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(
                or_(User.name.ilike(pattern), User.username.ilike(pattern), User.employee_no.ilike(pattern))
            )
        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()
        query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user: User) -> User:
        await self.db.flush()
        await self.db.refresh(user)
        return user
