import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.experiment_projects.models import ProjectType


class CourseBase(BaseModel):
    code: str = Field(..., max_length=30)
    name: str = Field(..., max_length=200)
    department: str | None = None
    major: str | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: str | None = Field(None, max_length=30)
    name: str | None = Field(None, max_length=200)
    department: str | None = None
    major: str | None = None


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
    page: int
    page_size: int


class ExperimentProjectBase(BaseModel):
    course_id: uuid.UUID
    name: str = Field(..., max_length=200)
    type: ProjectType
    hours: int | None = Field(None, ge=0)
    instruments_needed: list | None = None
    consumables: list | None = None
    majors: list | None = None
    semester: str | None = None


class ExperimentProjectCreate(ExperimentProjectBase):
    pass


class ExperimentProjectUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    type: ProjectType | None = None
    hours: int | None = Field(None, ge=0)
    instruments_needed: list | None = None
    consumables: list | None = None
    majors: list | None = None
    semester: str | None = None


class ExperimentProjectResponse(ExperimentProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    course_name: str | None = None
    course_code: str | None = None
    created_at: datetime
    updated_at: datetime


class ExperimentProjectListResponse(BaseModel):
    items: list[ExperimentProjectResponse]
    total: int
    page: int
    page_size: int


class BatchCopyRequest(BaseModel):
    source_course_id: uuid.UUID
    target_course_id: uuid.UUID
    project_ids: list[uuid.UUID] | None = None


class BatchCopyResult(BaseModel):
    copied_count: int
