from __future__ import annotations

from sqlalchemy import select

from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.users.models import User


class FaceAdapter(BaseAdapter):
    integration_type = "face"
    data_file = "face_profiles.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "人脸数据文件为空或不存在", success=False)

        synced = 0
        for row in records:
            employee_no = row.get("employee_no")
            if not employee_no:
                continue
            result = await self.db.execute(select(User).where(User.employee_no == employee_no))
            user = result.scalar_one_or_none()
            if user:
                user.face_registered = row.get("registered", True)
                synced += 1

        await self.db.flush()
        return SyncResult(synced, f"人脸注册同步完成: {synced} 条用户记录")
