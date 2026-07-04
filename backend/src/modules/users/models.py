import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.types import JSONType, UUIDType

from src.core.database import Base


class UserRole(str, enum.Enum):
    SYSTEM_ADMIN = "system_admin"
    DEPT_ADMIN = "dept_admin"
    LAB_ADMIN = "lab_admin"
    TEACHER = "teacher"
    STUDENT = "student"
    GUEST = "guest"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_no: Mapped[str | None] = mapped_column(String(30), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.TEACHER, nullable=False, index=True
    )
    department: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
