# 实验室管理系统

面向高校的 B/S 实验室综合管理平台，覆盖实验室信息、设备仪器、预约审批、实验项目、故障上报、数据填报、统计分析、外部系统对接及经营性收费等全业务链条。

## 技术栈

- **后端**: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
- **前端**: React 18 + TypeScript + Vite + Ant Design

## 快速开始

```bash
# 数据库
docker compose up -d db

# 后端
cd backend && cp .env.example .env
pip install -e ".[dev]"
alembic upgrade head
uvicorn src.main:app --reload --port 8000

# 前端
cd frontend && npm install && npm run dev
```

- API 文档：http://localhost:8000/docs
- 前端：http://localhost:5173

## 文档

| 文档 | 说明 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 完整需求规格说明书（12 大模块） |
| [docs/roadmap.md](docs/roadmap.md) | 开发路线图（P0–P3） |
| [docs/architecture.md](docs/architecture.md) | 系统架构设计 |
| [docs/modules/lab-management.md](docs/modules/lab-management.md) | 实验室信息模块设计 |
| [docs/modules/experiment-management.md](docs/modules/experiment-management.md) | 科研实验模块设计 |

## 当前进度（P0）

| 模块 | 状态 |
|------|------|
| 空间管理（楼栋/楼层/房间） | ✅ |
| 实验室基本信息 CRUD | ✅ |
| 多维筛选（楼栋/楼层/类型/状态） | ✅ |
| Excel 导入导出 | ✅ |
| 科研实验管理 | ✅ |
| 实验员管理 | 📋 待开发 |
| 实验室变更审批 | 📋 待开发 |
| 用户 RBAC / SSO | 📋 待开发 |

## 项目结构

```
├── docs/           # 需求、架构、模块设计
├── backend/        # FastAPI 后端
│   └── src/modules/
│       ├── spaces/       # 空间管理
│       ├── labs/         # 实验室信息
│       └── experiments/  # 科研实验
└── frontend/       # React 前端
    └── src/features/
        ├── labs/
        └── experiments/
```
