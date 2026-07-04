import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user, require_roles
from src.modules.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentResponse,
    KnowledgeDocumentUpdate,
    KnowledgeSearchResult,
)
from src.modules.knowledge.service import KnowledgeService
from src.modules.users.models import User, UserRole

router = APIRouter(prefix="/knowledge", tags=["知识库"])


def get_service(db: AsyncSession = Depends(get_db)) -> KnowledgeService:
    return KnowledgeService(db)


@router.get("/search", response_model=list[KnowledgeSearchResult])
async def search_knowledge(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    service: KnowledgeService = Depends(get_service),
):
    return await service.search(q, limit=limit)


@router.get("", response_model=KnowledgeDocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    user: User = Depends(get_current_user),
    service: KnowledgeService = Depends(get_service),
):
    return await service.list(page=page, page_size=page_size, category=category)


@router.post("", response_model=KnowledgeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    data: KnowledgeDocumentCreate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: KnowledgeService = Depends(get_service),
):
    return await service.create(data)


@router.get("/{doc_id}", response_model=KnowledgeDocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: KnowledgeService = Depends(get_service),
):
    return await service.get(doc_id)


@router.patch("/{doc_id}", response_model=KnowledgeDocumentResponse)
async def update_document(
    doc_id: uuid.UUID,
    data: KnowledgeDocumentUpdate,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: KnowledgeService = Depends(get_service),
):
    return await service.update(doc_id, data)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: uuid.UUID,
    _: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN)),
    service: KnowledgeService = Depends(get_service),
):
    await service.delete(doc_id)
