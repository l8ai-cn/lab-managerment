import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.types import JSONType, UUIDType

from src.core.database import Base


class ProjectType(str, enum.Enum):
    VERIFICATION = "verification"
    COMPREHENSIVE = "comprehensive"
    DESIGN = "design"
    INNOVATION = "innovation"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str | None] = mapped_column(String(200))
    major: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    projects: Mapped[list["ExperimentProject"]] = relationship(back_populates="course", lazy="selectin")


class ExperimentProject(Base):
    __tablename__ = "experiment_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("courses.id"), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[ProjectType] = mapped_column(Enum(ProjectType, name="project_type"), nullable=False)
    hours: Mapped[int | None] = mapped_column(Integer)
    instruments_needed: Mapped[list | None] = mapped_column(JSONType, default=list)
    consumables: Mapped[list | None] = mapped_column(JSONType, default=list)
    majors: Mapped[list | None] = mapped_column(JSONType, default=list)
    semester: Mapped[str | None] = mapped_column(String(20), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    course = relationship("Course", back_populates="projects", lazy="selectin")
