"""CAS/OIDC SSO local flow."""

from __future__ import annotations

import secrets
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.core.security import create_access_token
from src.modules.users.models import User
from src.modules.users.schemas import TokenResponse, UserResponse
from src.modules.users.service import UserService

router = APIRouter(prefix="/auth/sso", tags=["SSO认证"])

# In-memory state store for local dev (single-process)
_sso_states: dict[str, str] = {}


@router.get("/login")
async def sso_login(redirect_uri: str = Query("/")):
    state = secrets.token_urlsafe(16)
    _sso_states[state] = redirect_uri
    if settings.sso_idp_url:
        params = urlencode({
            "client_id": "lab-management",
            "redirect_uri": f"{settings.sso_idp_url.rstrip('/')}/callback",
            "response_type": "code",
            "state": state,
            "scope": "openid profile",
        })
        return RedirectResponse(url=f"{settings.sso_idp_url}/authorize?{params}")
    return RedirectResponse(url=f"/api/v1/auth/sso/callback?code=local&state={state}")


@router.get("/callback", response_model=TokenResponse)
async def sso_callback(
    code: str = Query(...),
    state: str = Query(...),
    username: str | None = Query(None, description="Local dev: map to existing username"),
    db: AsyncSession = Depends(get_db),
):
    redirect_uri = _sso_states.pop(state, None)
    if redirect_uri is None and state not in _sso_states:
        pass  # allow replay in dev for direct API calls

    if settings.sso_idp_url and code != "local":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="外部 IdP token 交换需在部署环境配置",
        )

    mapped_username = username or "admin"
    result = await db.execute(select(User).where(User.username == mapped_username, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"SSO 用户映射失败: {mapped_username}")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
