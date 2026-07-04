from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.instruments.models import Instrument, InstrumentStatus


class AssetAdapter(BaseAdapter):
    integration_type = "asset"
    data_file = "assets.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "资产数据文件为空或不存在", success=False)

        synced = 0
        for row in records:
            asset_no = row.get("asset_no")
            if not asset_no:
                continue
            result = await self.db.execute(select(Instrument).where(Instrument.asset_no == asset_no))
            inst = result.scalar_one_or_none()
            if inst:
                inst.name = row.get("name", inst.name)
                inst.model = row.get("model", inst.model)
                inst.manufacturer = row.get("manufacturer", inst.manufacturer)
                inst.category = row.get("category", inst.category)
                if row.get("purchase_price"):
                    inst.purchase_price = row["purchase_price"]
                inst.synced_from_asset = True
            else:
                code = row.get("code") or f"AST-{asset_no[-6:]}"
                existing_code = await self.db.execute(select(Instrument).where(Instrument.code == code))
                if existing_code.scalar_one_or_none():
                    code = f"{code}-{synced + 1}"
                inst = Instrument(
                    code=code,
                    name=row["name"],
                    model=row.get("model"),
                    manufacturer=row.get("manufacturer"),
                    serial_no=row.get("serial_no"),
                    asset_no=asset_no,
                    category=row.get("category"),
                    purchase_price=row.get("purchase_price"),
                    location=row.get("location"),
                    status=InstrumentStatus(row.get("status", "normal")),
                    synced_from_asset=True,
                )
                self.db.add(inst)
            synced += 1

        await self.db.flush()
        return SyncResult(synced, f"资产同步完成: {synced} 条记录")
