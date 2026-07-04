import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.notifications import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send(self, user_id: uuid.UUID, title: str, content: str, category: str = "system") -> None:
        self.db.add(Notification(user_id=user_id, title=title, content=content, category=category))
        await self.db.flush()

    async def list_for_user(self, user_id: uuid.UUID, *, unread_only: bool = False, limit: int = 50) -> list[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read.is_(False))
        result = await self.db.execute(query.order_by(Notification.created_at.desc()).limit(limit))
        return list(result.scalars().all())

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = await self.db.execute(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))
        n = result.scalar_one_or_none()
        if n:
            n.is_read = True
            await self.db.flush()

    async def unread_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        )
        return result.scalar_one()
