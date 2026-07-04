from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from src.modules.integrations.adapters.base import BaseAdapter, SyncResult
from src.modules.integrations.models import SafetyExamRecord
from src.modules.users.models import User


class SafetyExamAdapter(BaseAdapter):
    integration_type = "safety_exam"
    data_file = "safety_exams.json"

    async def sync(self) -> SyncResult:
        records = self.load_data()
        if not records:
            return SyncResult(0, "安全考试数据文件为空或不存在", success=False)

        synced = 0
        now = datetime.now(UTC)
        for row in records:
            employee_no = row.get("employee_no")
            exam_name = row.get("exam_name")
            if not employee_no or not exam_name:
                continue
            user_result = await self.db.execute(select(User).where(User.employee_no == employee_no))
            user = user_result.scalar_one_or_none()
            existing = await self.db.execute(
                select(SafetyExamRecord).where(
                    SafetyExamRecord.employee_no == employee_no,
                    SafetyExamRecord.exam_name == exam_name,
                )
            )
            record = existing.scalar_one_or_none()
            exam_date = None
            if row.get("exam_date"):
                try:
                    exam_date = datetime.fromisoformat(row["exam_date"].replace("Z", "+00:00"))
                except ValueError:
                    exam_date = now
            if record:
                record.score = row.get("score", record.score)
                record.passed = row.get("passed", record.passed)
                record.exam_date = exam_date or record.exam_date
                record.user_id = user.id if user else record.user_id
                record.synced_at = now
            else:
                self.db.add(
                    SafetyExamRecord(
                        employee_no=employee_no,
                        user_id=user.id if user else None,
                        exam_name=exam_name,
                        score=row.get("score"),
                        passed=row.get("passed", False),
                        exam_date=exam_date,
                        synced_at=now,
                    )
                )
            synced += 1

        await self.db.flush()
        return SyncResult(synced, f"安全考试同步完成: {synced} 条记录")
