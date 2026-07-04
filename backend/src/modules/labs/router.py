import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.modules.labs.models import LabType, OpenStatus
from src.modules.labs.schemas import (
    LabCreate,
    LabImportResult,
    LabListResponse,
    LabResponse,
    LabUpdate,
)
from src.modules.labs.service import LabService

router = APIRouter(prefix="/labs", tags=["实验室管理"])


def get_service(db: AsyncSession = Depends(get_db)) -> LabService:
    return LabService(db)


@router.get("", response_model=LabListResponse)
async def list_labs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    building_id: uuid.UUID | None = None,
    floor_id: uuid.UUID | None = None,
    lab_type: LabType | None = None,
    open_status: OpenStatus | None = None,
    open_statuses: list[OpenStatus] | None = Query(None),
    keyword: str | None = None,
    manager_id: uuid.UUID | None = None,
    service: LabService = Depends(get_service),
):
    return await service.list(
        page=page,
        page_size=page_size,
        building_id=building_id,
        floor_id=floor_id,
        lab_type=lab_type,
        open_status=open_status,
        open_statuses=open_statuses,
        keyword=keyword,
        manager_id=manager_id,
    )


@router.post("", response_model=LabResponse, status_code=status.HTTP_201_CREATED)
async def create_lab(data: LabCreate, service: LabService = Depends(get_service)):
    return await service.create(data)


@router.get("/export")
async def export_labs(service: LabService = Depends(get_service)):
    content = await service.export_to_excel()
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=labs_export.xlsx"},
    )


@router.post("/import", response_model=LabImportResult)
async def import_labs(
    file: UploadFile = File(...),
    service: LabService = Depends(get_service),
):
    return await service.import_from_excel(file)


@router.get("/{lab_id}", response_model=LabResponse)
async def get_lab(lab_id: uuid.UUID, service: LabService = Depends(get_service)):
    return await service.get(lab_id)


@router.patch("/{lab_id}", response_model=LabResponse)
async def update_lab(
    lab_id: uuid.UUID, data: LabUpdate, service: LabService = Depends(get_service)
):
    return await service.update(lab_id, data)


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab(lab_id: uuid.UUID, service: LabService = Depends(get_service)):
    await service.delete(lab_id)
