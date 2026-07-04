"""全平台演示数据种子 — 运行: python -m scripts.seed_full_platform"""

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from src.core.database import async_session_factory, init_database
from src.core.security import hash_password
from src.modules.data_reporting.models import DataReportSubmission, DataReportTemplate, ReportSubmissionStatus
from src.modules.experiment_projects.models import Course, ExperimentProject, ProjectType
from src.modules.faults.models import FaultHandlingRecord, FaultReport, FaultStatus
from src.modules.integrations.models import SafetyExamRecord
from src.modules.instruments.models import (
    BookingStatus,
    Instrument,
    InstrumentBooking,
    InstrumentBookingRule,
    InstrumentStatus,
)
from src.modules.knowledge.models import KnowledgeDocument
from src.modules.knowledge.service import _sync_fts, ensure_fts_table, rebuild_all_fts
from src.modules.lab_bookings.models import (
    LabBooking,
    LabBookingRule,
    LabBookingStatus,
    UsageType,
)
from src.modules.labs.models import Lab, LabType, OpenStatus
from src.modules.payments.models import FeeType, PaymentOrder, PaymentStatus
from src.modules.spaces.models import Building, Floor, Room
from src.modules.users.models import User, UserRole

# Fixed payment order IDs for bank_statements.json sync
PAY_ORDER_IDS = [
    uuid.UUID("00000000-0000-0000-0000-000000000001"),
    uuid.UUID("00000000-0000-0000-0000-000000000002"),
    uuid.UUID("00000000-0000-0000-0000-000000000003"),
    uuid.UUID("00000000-0000-0000-0000-000000000004"),
    uuid.UUID("00000000-0000-0000-0000-000000000005"),
]


async def seed():
    await init_database()
    async with async_session_factory() as db:
        # --- Buildings / Floors / Rooms ---
        buildings = []
        for i, (name, code) in enumerate([
            ("理工楼", "LG-A"),
            ("实验楼", "SY-B"),
            ("科技楼", "KJ-C"),
        ], start=1):
            b = Building(id=uuid.uuid4(), name=name, code=code, address=f"校区{'东' if i == 1 else '西' if i == 2 else '南'}侧")
            db.add(b)
            buildings.append(b)
        await db.flush()

        floors = []
        rooms = []
        for b_idx, b in enumerate(buildings):
            for fn in range(1, 3):
                f = Floor(id=uuid.uuid4(), building_id=b.id, name=f"{fn}层", floor_number=fn)
                db.add(f)
                floors.append(f)
                await db.flush()
                for rn in range(1, 3):
                    code = f"{b.code}-{fn}0{rn}"
                    r = Room(
                        id=uuid.uuid4(),
                        floor_id=f.id,
                        name=f"{fn}0{rn}",
                        code=code,
                        area_sqm=100 + b_idx * 20 + fn * 10,
                    )
                    db.add(r)
                    rooms.append(r)
        await db.flush()

        # --- Users (15) ---
        users_spec = [
            ("admin", "admin123", "系统管理员", "A001", UserRole.SYSTEM_ADMIN, "信息中心"),
            ("dept_admin", "dept123", "院系管理员", "DA001", UserRole.DEPT_ADMIN, "化学学院"),
            ("lab_admin1", "lab123", "实验室管理员甲", "LA001", UserRole.LAB_ADMIN, "化学学院"),
            ("lab_admin2", "lab456", "实验室管理员乙", "LA002", UserRole.LAB_ADMIN, "物理学院"),
            ("teacher1", "teacher123", "王教授", "T001", UserRole.TEACHER, "化学学院"),
            ("teacher2", "teacher123", "李副教授", "T002", UserRole.TEACHER, "化学学院"),
            ("teacher3", "teacher123", "张老师", "T003", UserRole.TEACHER, "物理学院"),
            ("teacher4", "teacher123", "赵老师", "T004", UserRole.TEACHER, "生命科学学院"),
            ("student1", "student123", "陈同学", "S001", UserRole.STUDENT, "化学学院"),
            ("student2", "student123", "刘同学", "S002", UserRole.STUDENT, "化学学院"),
            ("student3", "student123", "赵同学", "S003", UserRole.STUDENT, "物理学院"),
            ("student4", "student123", "孙同学", "S004", UserRole.STUDENT, "生命科学学院"),
            ("student5", "student123", "周同学", "S005", UserRole.STUDENT, "化学学院"),
            ("student6", "student123", "吴同学", "S006", UserRole.STUDENT, "物理学院"),
            ("guest1", "guest123", "访客用户", "G001", UserRole.GUEST, "外部单位"),
        ]
        users: dict[str, User] = {}
        for username, pwd, name, emp_no, role, dept in users_spec:
            u = User(
                id=uuid.uuid4(),
                username=username,
                password_hash=hash_password(pwd),
                name=name,
                employee_no=emp_no,
                role=role,
                department=dept,
                card_no=f"2024{emp_no[-3:]}",
                campus_id=f"U{emp_no}",
            )
            db.add(u)
            users[username] = u
        await db.flush()

        admin = users["admin"]
        lab_admin1 = users["lab_admin1"]

        # --- Labs (8) ---
        lab_names = [
            ("LAB-2026-0001", "基础化学实验室", LabType.TEACHING),
            ("LAB-2026-0002", "分析测试中心", LabType.RESEARCH),
            ("LAB-2026-0003", "有机化学实验室", LabType.TEACHING),
            ("LAB-2026-0004", "物理光学实验室", LabType.TEACHING),
            ("LAB-2026-0005", "材料分析实验室", LabType.RESEARCH),
            ("LAB-2026-0006", "生物化学实验室", LabType.COMPREHENSIVE),
            ("LAB-2026-0007", "创新实践实验室", LabType.INNOVATION),
            ("LAB-2026-0008", "仪器培训室", LabType.TRAINING),
        ]
        labs: list[Lab] = []
        for i, (code, name, ltype) in enumerate(lab_names):
            lab = Lab(
                id=uuid.uuid4(),
                code=code,
                name=name,
                room_id=rooms[i % len(rooms)].id,
                lab_type=ltype,
                open_status=OpenStatus.OPEN if i < 7 else OpenStatus.MAINTENANCE,
                capacity=30 + i * 5,
                area_sqm=120 + i * 10,
                manager_id=lab_admin1.id if i % 2 == 0 else users["lab_admin2"].id,
            )
            db.add(lab)
            labs.append(lab)
        await db.flush()

        # --- Booking rules for all labs ---
        all_days_hours = {
            day: [{"start": "08:00", "end": "22:00"}]
            for day in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
        }
        for lab in labs:
            db.add(
                LabBookingRule(
                    id=uuid.uuid4(),
                    lab_id=lab.id,
                    open_hours=all_days_hours,
                    allowed_roles=["teacher", "student", "lab_admin", "system_admin"],
                    daily_limit=3,
                )
            )
        await db.flush()

        # --- Instruments (15) ---
        inst_specs = [
            ("INS-2026-0001", "高效液相色谱仪", "分析仪器", 580000, 1),
            ("INS-2026-0002", "紫外分光光度计", "分析仪器", 120000, 0),
            ("INS-2026-0003", "扫描电子显微镜", "显微分析", 2800000, 4),
            ("INS-2026-0004", "原子吸收光谱仪", "分析仪器", 450000, 1),
            ("INS-2026-0005", "PCR扩增仪", "生命科学", 85000, 5),
            ("INS-2026-0006", "傅里叶红外光谱仪", "分析仪器", 620000, 1),
            ("INS-2026-0007", "气相色谱质谱联用仪", "分析仪器", 980000, 1),
            ("INS-2026-0008", "激光共聚焦显微镜", "显微分析", 3200000, 5),
            ("INS-2026-0009", "X射线衍射仪", "结构分析", 1500000, 4),
            ("INS-2026-0010", "荧光光谱仪", "分析仪器", 380000, 1),
            ("INS-2026-0011", "旋转蒸发仪", "合成设备", 45000, 2),
            ("INS-2026-0012", "超净工作台", "生命科学", 28000, 5),
            ("INS-2026-0013", "磁控溅射仪", "材料制备", 890000, 4),
            ("INS-2026-0014", "万能试验机", "力学测试", 520000, 4),
            ("INS-2026-0015", "示波器", "电子测量", 35000, 3),
        ]
        instruments: list[Instrument] = []
        for code, name, cat, price, lab_idx in inst_specs:
            inst = Instrument(
                id=uuid.uuid4(),
                code=code,
                name=name,
                model=f"Model-{code[-4:]}",
                manufacturer="岛津" if "色谱" in name or "光谱" in name else "Agilent",
                asset_no=f"ZC2024{code[-4:]}",
                category=cat,
                purchase_price=price,
                lab_id=labs[lab_idx].id,
                manager_id=lab_admin1.id,
                status=InstrumentStatus.NORMAL,
            )
            db.add(inst)
            instruments.append(inst)
        await db.flush()

        inst_all_days = {day: [{"start": "00:00", "end": "23:59"}] for day in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")}
        for inst in instruments:
            db.add(
                InstrumentBookingRule(
                    id=uuid.uuid4(),
                    instrument_id=inst.id,
                    open_hours=inst_all_days,
                    min_duration_minutes=30,
                    max_duration_minutes=480,
                    daily_limit=5,
                    weekly_limit=15,
                    advance_hours=0,
                    approval_mode="manager",
                    is_active=True,
                )
            )
        await db.flush()

        now = datetime.now(UTC)
        students = [users[f"student{i}"] for i in range(1, 7)]
        teachers = [users[f"teacher{i}"] for i in range(1, 5)]

        # --- Lab bookings (20) ---
        booking_statuses = [
            LabBookingStatus.PENDING, LabBookingStatus.APPROVED, LabBookingStatus.APPROVED,
            LabBookingStatus.COMPLETED, LabBookingStatus.REJECTED, LabBookingStatus.CANCELLED,
        ]
        lab_bookings: list[LabBooking] = []
        for i in range(20):
            start = now + timedelta(days=i - 10, hours=9)
            end = start + timedelta(hours=2 + (i % 3))
            b = LabBooking(
                id=uuid.uuid4(),
                lab_id=labs[i % len(labs)].id,
                user_id=(students + teachers)[i % 10].id,
                start_time=start,
                end_time=end,
                usage_type=list(UsageType)[i % len(UsageType)],
                purpose=f"实验活动 #{i + 1}",
                expected_count=5 + (i % 10),
                status=booking_statuses[i % len(booking_statuses)],
                is_recurring=i == 19,
                recurrence_rule={"frequency": "weekly", "count": 4, "interval": 1} if i == 19 else None,
            )
            db.add(b)
            lab_bookings.append(b)
        await db.flush()

        # --- Instrument bookings (15) ---
        inst_statuses = [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.COMPLETED, BookingStatus.REJECTED]
        for i in range(15):
            start = now + timedelta(days=i - 5, hours=10)
            db.add(
                InstrumentBooking(
                    id=uuid.uuid4(),
                    instrument_id=instruments[i % len(instruments)].id,
                    user_id=students[i % len(students)].id,
                    start_time=start,
                    end_time=start + timedelta(hours=3),
                    purpose=f"仪器测试 #{i + 1}",
                    project_name=f"课题-{i + 1}",
                    status=inst_statuses[i % len(inst_statuses)],
                )
            )
        await db.flush()

        # --- Faults (10) with handling records ---
        fault_types = ["设备故障", "水电问题", "安全隐患", "网络故障", "空调异常"]
        fault_statuses = [FaultStatus.PENDING, FaultStatus.ASSIGNED, FaultStatus.PROCESSING, FaultStatus.RESOLVED]
        for i in range(10):
            report = FaultReport(
                id=uuid.uuid4(),
                lab_id=labs[i % len(labs)].id,
                reporter_id=students[i % len(students)].id,
                fault_type=fault_types[i % len(fault_types)],
                description=f"故障描述 #{i + 1}：需要尽快处理",
                status=fault_statuses[i % len(fault_statuses)],
                assignee_id=lab_admin1.id if i % 2 == 0 else None,
            )
            db.add(report)
            await db.flush()
            if i >= 2:
                db.add(
                    FaultHandlingRecord(
                        report_id=report.id,
                        handler_id=lab_admin1.id,
                        action="handle" if i < 6 else "resolve",
                        comment=f"处理记录 #{i + 1}",
                    )
                )
        await db.flush()

        # --- Payment orders (5, some paid) ---
        for i, order_id in enumerate(PAY_ORDER_IDS):
            db.add(
                PaymentOrder(
                    id=order_id,
                    user_id=students[i % len(students)].id,
                    ref_type="lab_booking",
                    ref_id=lab_bookings[i].id,
                    amount=50.0 + i * 30,
                    fee_type=FeeType.LAB_USAGE if i % 2 == 0 else FeeType.CONSUMABLE,
                    status=PaymentStatus.PAID if i < 3 else PaymentStatus.PENDING,
                    bank_ref=f"BOC2024070400{i + 1}" if i < 3 else None,
                    paid_at=now - timedelta(days=3 - i) if i < 3 else None,
                )
            )
        await db.flush()

        # --- MOE data report templates (基表1-7 simplified) ---
        moe_templates = [
            ("MOE-T01", "基表1-教学科研仪器设备", {"fields": ["仪器编号", "名称", "单价", "使用机时"]}),
            ("MOE-T02", "基表2-仪器设备增减变动", {"fields": ["变动类型", "数量", "金额"]}),
            ("MOE-T03", "基表3-贵重仪器设备", {"fields": ["仪器名称", "原值", "使用方向"]}),
            ("MOE-T04", "基表4-教学实验项目", {"fields": ["项目名称", "学时", "人数"]}),
            ("MOE-T05", "基表5-专任实验室人员", {"fields": ["姓名", "职称", "学历"]}),
            ("MOE-T06", "基表6-实验室基本情况", {"fields": ["面积", "设备数", "经费"]}),
            ("MOE-T07", "基表7-实验室经费情况", {"fields": ["经费来源", "金额", "用途"]}),
        ]
        templates: list[DataReportTemplate] = []
        for code, name, schema in moe_templates:
            t = DataReportTemplate(id=uuid.uuid4(), code=code, name=name, schema=schema, description=f"教育部{name}")
            db.add(t)
            templates.append(t)
        await db.flush()

        for i, t in enumerate(templates[:3]):
            db.add(
                DataReportSubmission(
                    template_id=t.id,
                    unit_name="化学学院",
                    period="2025",
                    data={"reported": True, "index": i + 1},
                    status=ReportSubmissionStatus.SUBMITTED if i < 2 else ReportSubmissionStatus.DRAFT,
                )
            )
        await db.flush()

        # --- Courses & experiment projects ---
        course = Course(id=uuid.uuid4(), code="CHEM101", name="无机化学", department="化学学院", major="化学")
        db.add(course)
        await db.flush()
        for i, (pname, ptype) in enumerate([
            ("酸碱滴定实验", ProjectType.VERIFICATION),
            ("综合化学分析", ProjectType.COMPREHENSIVE),
            ("分子设计实验", ProjectType.DESIGN),
        ]):
            db.add(
                ExperimentProject(
                    course_id=course.id,
                    name=pname,
                    type=ptype,
                    hours=4 + i * 2,
                    instruments_needed=["紫外分光光度计"],
                    consumables=[{"name": "盐酸", "amount": "50ml"}],
                    majors=["化学"],
                    semester="2025-2026-1",
                )
            )
        await db.flush()

        # --- Knowledge base ---
        docs = [
            ("实验室安全守则", "进入实验室必须穿戴实验服和护目镜。严禁在实验室饮食。危化品使用须登记。", "安全规范", ["安全", "必读"]),
            ("预约政策说明", "实验室预约需提前24小时提交。重复预约每周不超过3次。取消预约需提前4小时。", "预约政策", ["预约"]),
            ("仪器使用规范", "使用精密仪器前须完成培训。使用后填写使用记录。发现异常立即报修。", "仪器管理", ["仪器"]),
        ]
        await ensure_fts_table(db)
        for title, content, category, tags in docs:
            doc = KnowledgeDocument(title=title, content=content, category=category, tags=tags)
            db.add(doc)
            await db.flush()
            await _sync_fts(db, doc)

        # --- Access control devices (class boards + doors) ---
        from src.modules.integrations.adapters.access import AccessAdapter

        access_result = await AccessAdapter(db).sync()
        print(f"  门禁/班牌同步: {access_result.message}")

        await rebuild_all_fts(db)

        # --- Safety exam records ---
        for emp_no, score, passed in [
            ("A001", 95, True), ("T001", 88, True), ("S001", 78, True),
            ("S002", 55, False), ("LA001", 90, True),
        ]:
            user_obj = next((u for u in users.values() if u.employee_no == emp_no), None)
            db.add(
                SafetyExamRecord(
                    employee_no=emp_no,
                    user_id=user_obj.id if user_obj else None,
                    exam_name="实验室安全准入考试",
                    score=score,
                    passed=passed,
                    exam_date=now - timedelta(days=30),
                )
            )

        await db.commit()
        print("全平台种子数据已写入：")
        print("  - 3 楼栋 / 6 楼层 / 12 房间")
        print("  - 15 用户 / 8 实验室 / 15 仪器")
        print("  - 20 实验室预约 / 15 仪器预约 / 10 故障")
        print("  - 5 支付订单 / 7 基表模板 / 3 知识库文档")
        print("账号: admin/admin123, teacher1/teacher123, student1/student123")


if __name__ == "__main__":
    asyncio.run(seed())
