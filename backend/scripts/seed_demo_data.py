"""演示数据种子脚本 — 运行: python -m scripts.seed_demo_data"""

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from src.core.database import async_session_factory
from src.core.security import hash_password
from src.modules.experiment_projects.models import Course, ExperimentProject, ProjectType
from src.modules.instruments.models import Instrument, InstrumentStatus
from src.modules.labs.models import Lab, LabType, OpenStatus
from src.modules.spaces.models import Building, Floor, Room
from src.modules.users.models import User, UserRole


async def seed():
    async with async_session_factory() as db:
        # 楼栋
        b = Building(id=uuid.uuid4(), name="理工楼", code="LG-A", address="校区东侧")
        db.add(b)
        await db.flush()
        f1 = Floor(id=uuid.uuid4(), building_id=b.id, name="1层", floor_number=1)
        f2 = Floor(id=uuid.uuid4(), building_id=b.id, name="2层", floor_number=2)
        db.add_all([f1, f2])
        await db.flush()
        r101 = Room(id=uuid.uuid4(), floor_id=f1.id, name="101", code="LG-A-101", area_sqm=120)
        r201 = Room(id=uuid.uuid4(), floor_id=f2.id, name="201", code="LG-A-201", area_sqm=150)
        db.add_all([r101, r201])
        await db.flush()

        admin = User(
            id=uuid.uuid4(), username="admin", password_hash=hash_password("admin123"),
            name="系统管理员", role=UserRole.SYSTEM_ADMIN, employee_no="A001",
        )
        teacher = User(
            id=uuid.uuid4(), username="teacher", password_hash=hash_password("teacher123"),
            name="张老师", role=UserRole.TEACHER, employee_no="T001", department="化学学院",
        )
        db.add_all([admin, teacher])
        await db.flush()

        lab1 = Lab(
            id=uuid.uuid4(), code="LAB-2026-0001", name="基础化学实验室",
            room_id=r101.id, lab_type=LabType.TEACHING, open_status=OpenStatus.OPEN,
            capacity=40, area_sqm=120, manager_id=admin.id,
        )
        lab2 = Lab(
            id=uuid.uuid4(), code="LAB-2026-0002", name="分析测试中心",
            room_id=r201.id, lab_type=LabType.RESEARCH, open_status=OpenStatus.OPEN,
            capacity=20, area_sqm=150, manager_id=admin.id,
        )
        db.add_all([lab1, lab2])
        await db.flush()

        inst1 = Instrument(
            id=uuid.uuid4(), code="INS-2026-0001", name="高效液相色谱仪",
            model="LC-2030", manufacturer="岛津", asset_no="ZC20240001",
            category="分析仪器", purchase_price=580000, lab_id=lab2.id,
            manager_id=admin.id, status=InstrumentStatus.NORMAL,
        )
        inst2 = Instrument(
            id=uuid.uuid4(), code="INS-2026-0002", name="紫外分光光度计",
            model="UV-2600", manufacturer="岛津", asset_no="ZC20240002",
            category="分析仪器", purchase_price=120000, lab_id=lab1.id,
            manager_id=admin.id, status=InstrumentStatus.NORMAL,
        )
        db.add_all([inst1, inst2])

        course = Course(id=uuid.uuid4(), code="CHEM101", name="无机化学", department="化学学院", major="化学")
        db.add(course)
        await db.flush()
        db.add(ExperimentProject(
            id=uuid.uuid4(), course_id=course.id, name="酸碱滴定实验",
            type=ProjectType.VERIFICATION, hours=4,
            instruments_needed=["紫外分光光度计"], consumables=[{"name": "盐酸", "amount": "50ml"}],
            majors=["化学"], semester="2025-2026-1",
        ))

        await db.commit()
        print("演示数据已写入：2间实验室、2台仪器、1门课程、1个实验项目")
        print("账号: admin/admin123, teacher/teacher123")


if __name__ == "__main__":
    asyncio.run(seed())
