from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.knowledge.embedding import cosine_similarity, term_vector
from src.modules.knowledge.models import KnowledgeDocument
from src.modules.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentResponse,
    KnowledgeDocumentUpdate,
    KnowledgeSearchResult,
)


def _doc_response(doc: KnowledgeDocument) -> KnowledgeDocumentResponse:
    return KnowledgeDocumentResponse.model_validate(doc)


async def ensure_fts_table(db: AsyncSession) -> None:
    await db.execute(
        text(
            "CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5("
            "title, content, doc_id UNINDEXED, tokenize='unicode61'"
            ")"
        )
    )


async def _sync_fts(db: AsyncSession, doc: KnowledgeDocument) -> None:
    await ensure_fts_table(db)
    await db.execute(text("DELETE FROM knowledge_fts WHERE doc_id = :doc_id"), {"doc_id": str(doc.id)})
    await db.execute(
        text("INSERT INTO knowledge_fts (title, content, doc_id) VALUES (:title, :content, :doc_id)"),
        {"title": doc.title, "content": doc.content, "doc_id": str(doc.id)},
    )


class KnowledgeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: KnowledgeDocumentCreate) -> KnowledgeDocumentResponse:
        doc = KnowledgeDocument(**data.model_dump())
        self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        await _sync_fts(self.db, doc)
        await self.db.commit()
        return _doc_response(doc)

    async def get(self, doc_id: uuid.UUID) -> KnowledgeDocumentResponse:
        doc = await self._get_doc(doc_id)
        return _doc_response(doc)

    async def _get_doc(self, doc_id: uuid.UUID) -> KnowledgeDocument:
        result = await self.db.execute(select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在")
        return doc

    async def list(self, *, page: int = 1, page_size: int = 20, category: str | None = None) -> KnowledgeDocumentListResponse:
        query = select(KnowledgeDocument)
        if category:
            query = query.where(KnowledgeDocument.category == category)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        result = await self.db.execute(
            query.order_by(KnowledgeDocument.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        items = list(result.scalars().all())
        return KnowledgeDocumentListResponse(
            items=[_doc_response(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update(self, doc_id: uuid.UUID, data: KnowledgeDocumentUpdate) -> KnowledgeDocumentResponse:
        doc = await self._get_doc(doc_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(doc, k, v)
        await self.db.flush()
        await _sync_fts(self.db, doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return _doc_response(doc)

    async def delete(self, doc_id: uuid.UUID) -> None:
        doc = await self._get_doc(doc_id)
        await ensure_fts_table(self.db)
        await self.db.execute(text("DELETE FROM knowledge_fts WHERE doc_id = :doc_id"), {"doc_id": str(doc.id)})
        await self.db.delete(doc)
        await self.db.commit()

    async def search(self, q: str, *, limit: int = 20) -> list[KnowledgeSearchResult]:
        await ensure_fts_table(self.db)
        safe_q = q.replace('"', '""')
        result = await self.db.execute(
            text(
                "SELECT doc_id, snippet(knowledge_fts, 1, '<b>', '</b>', '...', 32) AS snippet "
                "FROM knowledge_fts WHERE knowledge_fts MATCH :query LIMIT :limit"
            ),
            {"query": safe_q, "limit": limit},
        )
        rows = result.fetchall()
        if not rows:
            return []
        doc_ids = [uuid.UUID(row[0]) for row in rows]
        docs_result = await self.db.execute(select(KnowledgeDocument).where(KnowledgeDocument.id.in_(doc_ids)))
        doc_map = {d.id: d for d in docs_result.scalars().all()}
        return [
            KnowledgeSearchResult(
                id=doc_id,
                title=doc_map[doc_id].title,
                snippet=snippet or doc_map[doc_id].content[:120],
                category=doc_map[doc_id].category,
            )
            for doc_id, snippet in rows
            if doc_id in doc_map
        ]

    async def search_hybrid(self, q: str, *, limit: int = 20) -> list[KnowledgeSearchResult]:
        fts_results = await self.search(q, limit=limit * 2)
        fts_ids = {r.id for r in fts_results}
        query_vec = term_vector(q)
        result = await self.db.execute(select(KnowledgeDocument).limit(500))
        docs = list(result.scalars().all())
        scored: list[tuple[float, KnowledgeDocument]] = []
        for doc in docs:
            doc_vec = term_vector(f"{doc.title} {doc.content}")
            score = cosine_similarity(query_vec, doc_vec)
            if score > 0.05 or doc.id in fts_ids:
                scored.append((score, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        results: list[KnowledgeSearchResult] = []
        for score, doc in scored[:limit]:
            snippet = doc.content[:120] + ("..." if len(doc.content) > 120 else "")
            results.append(
                KnowledgeSearchResult(
                    id=doc.id,
                    title=doc.title,
                    snippet=snippet,
                    category=doc.category,
                    score=round(score, 4),
                )
            )
        return results
