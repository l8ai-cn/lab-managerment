from __future__ import annotations

from sqlalchemy import select

from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.users.models import User


class CardAdapter(BaseAdapter):
    integration_type = "card"
    data_file = "cards.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "一卡通数据文件为空或不存在", success=False)

        synced = 0
        for row in records:
            employee_no = row.get("employee_no")
            if not employee_no:
                continue
            result = await self.db.execute(select(User).where(User.employee_no == employee_no))
            user = result.scalar_one_or_none()
            if user:
                user.card_no = row.get("card_no", user.card_no)
                user.campus_id = row.get("campus_id", user.campus_id)
                synced += 1

        await self.db.flush()
        return SyncResult(synced, f"一卡通同步完成: {synced} 条用户记录")
