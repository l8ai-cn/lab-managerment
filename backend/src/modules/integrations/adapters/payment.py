from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

from sqlalchemy import select

from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.payments.models import PaymentOrder, PaymentReceipt, PaymentStatus


def deterministic_bank_ref(order_id) -> str:
    digest = hashlib.sha256(str(order_id).encode()).hexdigest()[:16].upper()
    return f"BOC{digest}"


class PaymentAdapter(BaseAdapter):
    integration_type = "payment"
    data_file = "bank_statements.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "银行流水数据文件为空或不存在", success=False)

        synced = 0
        for row in records:
            order_ref = row.get("order_ref")
            if not order_ref:
                continue
            try:
                order_uuid = uuid.UUID(str(order_ref))
            except ValueError:
                continue
            result = await self.db.execute(select(PaymentOrder).where(PaymentOrder.id == order_uuid))
            order = result.scalar_one_or_none()
            if not order:
                continue
            bank_ref = row.get("bank_ref") or deterministic_bank_ref(order.id)
            if order.status == PaymentStatus.PAID:
                synced += 1
                continue
            order.status = PaymentStatus.PAID
            order.bank_ref = bank_ref
            order.paid_at = datetime.now(UTC)
            receipt_result = await self.db.execute(
                select(PaymentReceipt).where(PaymentReceipt.order_id == order.id)
            )
            receipt = receipt_result.scalar_one_or_none()
            receipt_data = {
                "bank_ref": bank_ref,
                "amount": float(order.amount),
                "payer": row.get("payer"),
                "transaction_time": row.get("transaction_time"),
                "bank_name": row.get("bank_name", "中国银行"),
                "remark": row.get("remark"),
            }
            if receipt:
                receipt.receipt_data = receipt_data
            else:
                self.db.add(PaymentReceipt(order_id=order.id, receipt_data=receipt_data))
            synced += 1

        await self.db.flush()
        return SyncResult(synced, f"银行流水同步完成: {synced} 条支付记录")
