from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from src.modules.access_control.models import AccessControlDevice
from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.labs.models import Lab


class AccessAdapter(BaseAdapter):
    integration_type = "access"
    data_file = "access_devices.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "门禁设备数据文件为空或不存在", success=False)

        synced = 0
        now = datetime.now(UTC)
        for row in records:
            device_code = row.get("device_code")
            if not device_code:
                continue
            result = await self.db.execute(
                select(AccessControlDevice).where(AccessControlDevice.device_code == device_code)
            )
            device = result.scalar_one_or_none()
            lab_id = None
            lab_code = row.get("lab_code")
            if lab_code:
                lab_result = await self.db.execute(select(Lab).where(Lab.code == lab_code))
                lab = lab_result.scalar_one_or_none()
                if lab:
                    lab_id = lab.id
            if device:
                device.name = row.get("name", device.name)
                device.location = row.get("location", device.location)
                device.lab_id = lab_id or device.lab_id
                device.is_online = row.get("is_online", device.is_online)
                device.synced_at = now
            else:
                device = AccessControlDevice(
                    device_code=device_code,
                    name=row.get("name", device_code),
                    lab_id=lab_id,
                    location=row.get("location"),
                    device_type=row.get("device_type", "door"),
                    is_online=row.get("is_online", True),
                    synced_at=now,
                )
                self.db.add(device)
            synced += 1

        await self.db.flush()
        return SyncResult(synced, f"门禁设备同步完成: {synced} 条记录")
