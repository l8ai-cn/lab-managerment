# 实验室管理系统

面向科研与检测实验室的业务管理平台，当前正在建设 **实验管理模块**。

## 技术栈

- **后端**: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
- **前端**: React 18 + TypeScript + Vite + Ant Design

## 快速开始

### 1. 启动数据库

```bash
docker compose up -d db
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

API 文档：http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

## 项目结构

```
├── docs/                    # 设计文档
│   ├── architecture.md      # 系统架构
│   └── modules/
│       └── experiment-management.md  # 实验模块领域设计
├── backend/                 # FastAPI 后端
│   └── src/modules/
│       └── experiments/     # 实验管理模块
├── frontend/                # React 前端
│   └── src/features/
│       └── experiments/     # 实验管理页面
└── docker-compose.yml       # PostgreSQL
```

## 实验管理模块（P0）

已实现：

- 实验 CRUD（创建、查询、更新、软删除）
- 8 态状态机（草稿 → 计划 → 执行 → 完成/失败 → 归档）
- 列表筛选（状态、关键词、分页）
- 前端列表页、详情页、创建表单

详细设计见 [docs/modules/experiment-management.md](docs/modules/experiment-management.md)。

## 开发路线

| 阶段 | 内容 |
|------|------|
| P0 | 实验 CRUD + 状态机 + 基础前端 ✅ |
| P1 | 实验运行记录（ExperimentRun）、步骤与结果 |
| P2 | 对接样品、设备、方案、课题 |
| P3 | 审批工作流、通知、报告导出 |
