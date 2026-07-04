"""Minimal MCP-compatible JSON-RPC endpoint exposing core LabOS tools."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.deps import get_current_user
from src.modules.faults.service import FaultService
from src.modules.knowledge.service import KnowledgeService
from src.modules.lab_bookings.service import LabBookingService
from src.modules.labs.repository import LabRepository
from src.modules.users.models import User

router = APIRouter(prefix="/mcp", tags=["MCP 协议"])


class McpRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: str | int | None = None
    method: str
    params: dict[str, Any] = Field(default_factory=dict)


class McpResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: str | int | None = None
    result: Any | None = None
    error: dict[str, Any] | None = None


MCP_TOOLS = [
    {
        "name": "list_labs",
        "description": "列出实验室基本信息",
        "inputSchema": {"type": "object", "properties": {"keyword": {"type": "string"}, "limit": {"type": "integer"}}},
    },
    {
        "name": "search_knowledge",
        "description": "搜索知识库文档",
        "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
    },
    {
        "name": "get_fault_stats",
        "description": "获取故障统计概览",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_pending_lab_usage",
        "description": "列出待审核的实验室使用记录",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


async def _call_tool(method: str, params: dict[str, Any], db: AsyncSession, user: User) -> Any:
    if method == "initialize":
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "labos-mcp", "version": "0.3.0"},
        }
    if method == "tools/list":
        return {"tools": MCP_TOOLS}
    if method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments") or {}
        return await _execute_tool(tool_name, arguments, db, user)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown MCP method: {method}")


async def _execute_tool(name: str | None, args: dict[str, Any], db: AsyncSession, user: User) -> dict[str, Any]:
    if name == "list_labs":
        repo = LabRepository(db)
        keyword = args.get("keyword")
        limit = min(int(args.get("limit", 20)), 50)
        items, _ = await repo.list_labs(page=1, page_size=limit, keyword=keyword)
        content = [{"id": str(l.id), "code": l.code, "name": l.name, "open_status": l.open_status.value} for l in items]
        return {"content": [{"type": "text", "text": str(content)}]}
    if name == "search_knowledge":
        query = args.get("query", "")
        service = KnowledgeService(db)
        results = await service.search_hybrid(query, limit=10)
        return {"content": [{"type": "text", "text": str([r.model_dump() for r in results])}]}
    if name == "get_fault_stats":
        stats = await FaultService(db).stats()
        return {"content": [{"type": "text", "text": stats.model_dump_json()}]}
    if name == "list_pending_lab_usage":
        pending = await LabBookingService(db).list_pending_usage(page=1, page_size=20)
        return {"content": [{"type": "text", "text": pending.model_dump_json()}]}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown tool: {name}")


@router.post("", response_model=McpResponse)
async def mcp_endpoint(
    body: McpRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await _call_tool(body.method, body.params, db, user)
        return McpResponse(id=body.id, result=result)
    except HTTPException as exc:
        return McpResponse(id=body.id, error={"code": exc.status_code, "message": exc.detail})
    except Exception as exc:  # noqa: BLE001
        return McpResponse(id=body.id, error={"code": -32603, "message": str(exc)})


@router.get("/tools")
async def list_mcp_tools(user: User = Depends(get_current_user)):
    return {"tools": MCP_TOOLS}
