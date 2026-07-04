# 实验室管理系统

面向高校的 B/S 实验室综合管理平台，实现学校实验室全业务调度与管理。

## 功能模块（全部已实现）

| 模块 | 功能 |
|------|------|
| **实验室信息** | 基本信息、变更审批、实验员管理、空间层级 |
| **仪器设备** | 台账管理、预约规则、在线预约、审批、使用记录 |
| **实验室预约** | 规则配置、在线预约、审批、签到核验、门禁授权、使用记录 |
| **实验项目** | 课程实验项目 CRUD、批量复制、导入导出 |
| **故障上报** | 在线上报、处理流转、二维码入口、统计分析 |
| **数据填报** | 教育部基表模板、在线填报、汇总统计 |
| **统计分析** | 设备使用率、实验室人时数、故障统计 |
| **可视化大屏** | 运行态势、预约动态、趋势数据 |
| **系统对接** | 资产/一卡通/门禁/人脸/支付 Mock 适配器 |
| **收费管理** | 预约收费订单、中国银行支付 Mock |
| **开放 API** | 智能体查询接口（/api/v1/agent） |
| **通知消息** | 站内信、审批提醒 |

> SSO 单点登录按需求排除，使用 JWT 本地认证。

## 技术栈

- **后端**: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
- **前端**: React 18 + TypeScript + Vite + Ant Design

## 快速开始

```bash
# 1. 数据库
docker compose up -d db

# 2. 后端
cd backend && cp .env.example .env
pip install -e ".[dev]"
alembic upgrade head
python -m scripts.seed_demo_data   # 可选：写入演示数据
uvicorn src.main:app --reload --port 8000

# 3. 前端
cd frontend && npm install && npm run dev
```

- 登录：http://localhost:5173 — `admin / admin123`
- API 文档：http://localhost:8000/docs（94+ 端点）
- 可视化大屏：http://localhost:5173/dashboard

## 导航结构

```
实验室管理    → 实验室、实验员、变更管理
设备与预约    → 仪器台账、仪器预约、实验室预约
教学科研      → 实验项目、科研实验
运维管理      → 故障上报、数据填报
系统          → 统计分析、可视化大屏、系统对接、收费管理
```

## 项目结构

```
├── docs/                    # 需求、架构、开发计划
├── backend/
│   ├── alembic/             # 数据库迁移（001-004）
│   ├── scripts/             # 演示数据种子
│   └── src/
│       ├── modules/         # 15+ 业务模块
│       └── shared/          # 通知等共享服务
└── frontend/
    └── src/features/        # 按业务领域组织的前端页面
```

## 文档

| 文档 | 说明 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 需求规格说明书 |
| [docs/full-platform-plan.md](docs/full-platform-plan.md) | 全功能开发计划 |
| [docs/architecture.md](docs/architecture.md) | 系统架构 |
| [docs/roadmap.md](docs/roadmap.md) | 开发路线图 |
