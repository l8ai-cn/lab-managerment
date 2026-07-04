"""WeChat / DingTalk webhook push notifications."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.shared.notifications import Notification

logger = logging.getLogger(__name__)


async def _post_webhook(url: str, payload: dict) -> bool:
    if not url:
        return False
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return 200 <= resp.status < 300
    except (urllib.error.URLError, TimeoutError) as exc:
        logger.warning("Webhook push failed: %s", exc)
        return False


async def send_push(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    title: str,
    content: str,
    category: str = "system",
) -> None:
    """Log to notifications table and send to configured webhooks."""
    db.add(Notification(user_id=user_id, title=title, content=content, category=category))
    await db.flush()

    text = f"**{title}**\n{content}"
    wechat_payload = {"msgtype": "markdown", "markdown": {"content": text}}
    dingtalk_payload = {"msgtype": "markdown", "markdown": {"title": title, "text": text}}

    if settings.wechat_webhook_url:
        await _post_webhook(settings.wechat_webhook_url, wechat_payload)
    if settings.dingtalk_webhook_url:
        await _post_webhook(settings.dingtalk_webhook_url, dingtalk_payload)
