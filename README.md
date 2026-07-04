# lab-managerment · 实验管理业务系统

一套用于管理实验全生命周期的业务系统模块。当前版本提供**实验管理**核心能力:
实验的创建、维护、状态流转、过程记录,以及分页/条件查询,并附带完整的 REST API 与自动化测试。

## 技术栈

- **Python 3.12**
- **FastAPI** — Web 框架 / 自动生成 OpenAPI 文档
- **SQLAlchemy 2.x** — ORM
- **Pydantic v2** / pydantic-settings — 数据校验与配置管理
- **SQLite**(默认)— 开箱即用,可通过配置切换到 PostgreSQL 等
- **pytest** — 测试

## 目录结构

```
app/
├── main.py                 # FastAPI 应用入口(create_app / 异常处理)
├── core/
│   ├── config.py           # 配置(环境变量前缀 LAB_)
│   └── database.py         # 引擎、会话、建表
├── models/
│   ├── enums.py            # 状态/优先级/记录类型 + 状态机
│   └── experiment.py       # Experiment / ExperimentRecord ORM 模型
├── schemas/                # Pydantic 请求/响应模型
├── services/
│   └── experiment_service.py  # 业务逻辑(领域规则集中于此)
├── api/
│   ├── deps.py             # 依赖注入
│   └── routers/experiments.py # 实验管理路由
└── exceptions.py           # 领域异常(由 API 层转换为 HTTP)
tests/                      # pytest 集成测试(内存 SQLite)
```

采用**分层架构**:`router`(HTTP)→ `service`(业务规则)→ `model`(持久化),
领域异常与 HTTP 状态码解耦,便于后续扩展与复用。

## 领域模型

### 实验 Experiment

| 字段 | 说明 |
| --- | --- |
| `code` | 实验编号(唯一,不填自动生成 `EXP-YYYYMMDD-0001`) |
| `title` | 实验名称 |
| `description` | 实验描述 / 目的 |
| `status` | 状态(见下方状态机) |
| `priority` | 优先级:`low` / `medium` / `high` / `urgent` |
| `owner` | 负责人 |
| `lab_location` | 实验地点 |
| `tags` | 标签(建议逗号分隔) |
| `planned_start_at` / `planned_end_at` | 计划开始 / 结束时间 |
| `actual_start_at` / `actual_end_at` | 实际开始 / 结束时间(状态流转时自动维护) |

### 实验状态机

```
draft ──→ scheduled ──→ in_progress ──→ completed ──→ archived
  │           │              │
  │           └──→ cancelled ┘
  └──→ cancelled ──→ archived
```

- 进入 `in_progress` 时自动记录 `actual_start_at`。
- 进入 `completed` 时自动记录 `actual_end_at`。
- 非法流转返回 `422`。

### 实验记录 ExperimentRecord

实验过程中的备注 / 观察 / 结果 / 问题记录(`note` / `observation` / `result` / `issue`)。

## 快速开始

```bash
# 1. 安装依赖(推荐使用虚拟环境)
pip install -r requirements.txt

# 2. 启动服务
uvicorn app.main:app --reload

# 3. 打开交互式 API 文档
#    Swagger UI: http://127.0.0.1:8000/docs
#    ReDoc:      http://127.0.0.1:8000/redoc
```

## API 概览

基础路径:`/api/v1`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/experiments` | 创建实验 |
| `GET` | `/experiments` | 分页查询(支持 `status` / `owner` / `keyword` / `page` / `page_size`) |
| `GET` | `/experiments/{id}` | 获取实验详情(含过程记录) |
| `PATCH` | `/experiments/{id}` | 更新实验信息(部分更新) |
| `POST` | `/experiments/{id}/status` | 流转实验状态 |
| `DELETE` | `/experiments/{id}` | 删除实验 |
| `POST` | `/experiments/{id}/records` | 添加过程记录 |
| `GET` | `/experiments/{id}/records` | 查询过程记录 |
| `GET` | `/health` | 健康检查 |

### 示例

```bash
# 创建实验
curl -X POST http://127.0.0.1:8000/api/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{"title": "细胞培养实验", "owner": "张三", "priority": "high"}'

# 流转到进行中
curl -X POST http://127.0.0.1:8000/api/v1/experiments/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

## 配置

所有配置项通过环境变量(前缀 `LAB_`)或 `.env` 文件覆盖,例如:

```bash
LAB_DATABASE_URL=postgresql+psycopg://user:pass@localhost/lab
LAB_DEBUG=true
LAB_DEFAULT_PAGE_SIZE=20
```

## 测试

```bash
pip install -r requirements-dev.txt
pytest
```

测试使用内存 SQLite,相互隔离,不产生落盘文件。
