"""实验管理 REST API 路由。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_experiment_service
from app.core.config import settings
from app.models.enums import ExperimentStatus
from app.schemas.common import Page
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentRead,
    ExperimentRecordCreate,
    ExperimentRecordRead,
    ExperimentStatusUpdate,
    ExperimentUpdate,
)
from app.services.experiment_service import ExperimentService

router = APIRouter(prefix="/experiments", tags=["实验管理"])


@router.post(
    "",
    response_model=ExperimentRead,
    status_code=status.HTTP_201_CREATED,
    summary="创建实验",
)
def create_experiment(
    payload: ExperimentCreate,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentRead:
    experiment = service.create(payload)
    return ExperimentRead.model_validate(experiment)


@router.get(
    "",
    response_model=Page[ExperimentRead],
    summary="分页查询实验列表",
)
def list_experiments(
    page: int = Query(1, ge=1, description="页码,从 1 开始"),
    page_size: int = Query(
        settings.default_page_size,
        ge=1,
        le=settings.max_page_size,
        description="每页数量",
    ),
    status_filter: ExperimentStatus | None = Query(
        None, alias="status", description="按状态过滤"
    ),
    owner: str | None = Query(None, description="按负责人过滤"),
    keyword: str | None = Query(
        None, description="按名称 / 编号 / 描述模糊搜索"
    ),
    service: ExperimentService = Depends(get_experiment_service),
) -> Page[ExperimentRead]:
    items, total = service.list(
        page=page,
        page_size=page_size,
        status=status_filter,
        owner=owner,
        keyword=keyword,
    )
    return Page.create(
        items=[ExperimentRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{experiment_id}",
    response_model=ExperimentRead,
    summary="获取实验详情",
)
def get_experiment(
    experiment_id: int,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentRead:
    experiment = service.get(experiment_id)
    return ExperimentRead.model_validate(experiment)


@router.patch(
    "/{experiment_id}",
    response_model=ExperimentRead,
    summary="更新实验信息",
)
def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentRead:
    experiment = service.update(experiment_id, payload)
    return ExperimentRead.model_validate(experiment)


@router.post(
    "/{experiment_id}/status",
    response_model=ExperimentRead,
    summary="流转实验状态",
)
def change_experiment_status(
    experiment_id: int,
    payload: ExperimentStatusUpdate,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentRead:
    experiment = service.change_status(experiment_id, payload.status)
    return ExperimentRead.model_validate(experiment)


@router.delete(
    "/{experiment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="删除实验",
)
def delete_experiment(
    experiment_id: int,
    service: ExperimentService = Depends(get_experiment_service),
) -> Response:
    service.delete(experiment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{experiment_id}/records",
    response_model=ExperimentRecordRead,
    status_code=status.HTTP_201_CREATED,
    summary="为实验添加过程记录",
)
def add_experiment_record(
    experiment_id: int,
    payload: ExperimentRecordCreate,
    service: ExperimentService = Depends(get_experiment_service),
) -> ExperimentRecordRead:
    record = service.add_record(experiment_id, payload)
    return ExperimentRecordRead.model_validate(record)


@router.get(
    "/{experiment_id}/records",
    response_model=list[ExperimentRecordRead],
    summary="获取实验的过程记录列表",
)
def list_experiment_records(
    experiment_id: int,
    service: ExperimentService = Depends(get_experiment_service),
) -> list[ExperimentRecordRead]:
    records = service.list_records(experiment_id)
    return [ExperimentRecordRead.model_validate(r) for r in records]
