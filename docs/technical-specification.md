# LabOS 实验室管理系统 — 技术说明报告

> **版本：** v0.3.1  
> **编制日期：** 2026-07-04  
> **适用对象：** 技术评审、运维部署、二次开发团队

---

## 1. 系统概述

LabOS 是面向高校的 **B/S 架构实验室综合管理平台**，覆盖 12 大业务模块：实验室信息、设备仪器、预约审批、实验项目、故障上报、数据填报、统计分析、外部系统对接、智能体接口、银校收费等。

系统采用 **前后端分离** 设计，后端提供 RESTful API + OpenAPI 文档，前端为 React SPA，支持本地化部署（SQLite）与生产部署（PostgreSQL）。

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端运行时 | Python 3.12 + FastAPI | 异步 API、自动 OpenAPI |
| ORM / 迁移 | SQLAlchemy 2.x + Alembic | 关系建模与版本迁移 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） | JSON 字段、FTS5 全文检索 |
| 前端 | React 18 + TypeScript + Vite | SPA 单页应用 |
| UI 组件 | Ant Design 5 | 企业级表单/表格/布局 |
| 状态管理 | TanStack Query | 服务端状态缓存与轮询 |
| 智能助手 | CopilotKit + OpenAI | 侧边栏自然语言交互 |
| 文件存储 | 本地 `/uploads` 目录 | 图片/文档/视频附件 |
| 认证授权 | JWT + RBAC（6 角色） | SSO 单点登录扩展 |

### 2.2 分层架构

```
┌──────────────────────────────────────────────────────────┐
│  表示层：Web SPA / H5 移动端 / 可视化大屏 / CopilotKit 助手  │
├──────────────────────────────────────────────────────────┤
│  接口层：REST API / MCP JSON-RPC / CopilotKit Remote Actions│
├──────────────────────────────────────────────────────────┤
│  业务层：modules/*/service.py — 各模块业务逻辑              │
├──────────────────────────────────────────────────────────┤
│  数据层：modules/*/repository.py + SQLAlchemy ORM        │
├──────────────────────────────────────────────────────────┤
│  集成层：JSON 适配器 / Webhook 推送 / SSO / 支付流水        │
└──────────────────────────────────────────────────────────┘
```

### 2.3 目录结构

```
/workspace/
├── backend/src/
│   ├── main.py                 # FastAPI 入口
│   ├── core/                   # 配置、数据库、依赖注入
│   ├── shared/                 # 上传、通知、推送
│   └── modules/                # 业务模块（见 §3）
├── frontend/src/
│   ├── app/                    # 路由、登录、CopilotKit
│   ├── features/               # 按模块划分的页面与 API
│   ├── mobile/                 # H5 移动端
│   └── shared/                 # 通用组件、认证、主题
├── copilot-runtime/            # CopilotKit Node 运行时
├── backend/data/integrations/  # 外部系统模拟数据
└── docs/                       # 需求、审查、技术文档
```

---

## 3. 业务模块设计

### 3.1 实验室信息管理（模块 1）

- **核心实体：** `Lab`、`LabStaff`、`LabChange`
- **关键 API：** `GET/POST/PATCH /labs`、`POST /lab-changes`
- **审批流程：** 变更申请 → 所在单位审核 → 实验室管理中心审核，全程 `approval_records` 留痕
- **前端页面：** `/labs`、`/lab-staff`、`/lab-changes`
- **新增能力：** 巡查状态 `inspection_status`（正常/待巡查/存在问题）在列表、详情、表单中可维护

### 3.2 实验室设备管理（模块 2）

- **核心实体：** `Instrument`、`InstrumentBookingRule`、`InstrumentBooking`、`InstrumentUsageRecord`
- **预约规则：** 开放时段、时长限制、审批模式；**校外差异化规则** `external_rules`（优先级/收费/审批/日限额）
- **使用记录：** 提交 → 管理员审核；支持 **批量审核** API `/instrument-bookings/usage/batch-review`
- **前端页面：** `/instruments`、`/instrument-bookings`、`/instruments/rules`

### 3.3 实验室预约管理（模块 3）

- **核心实体：** `LabBookingRule`、`LabBooking`、`LabCheckIn`、`LabAccessGrant`、`LabUsageRecord`
- **预约规则：** 按使用类型差异化 `usage_type_rules`（教学/科研/开放/竞赛/社会服务）
- **门禁联动：** 审批通过生成 QR/人脸/密码凭证 → `AccessAdapter` 同步设备 → 模拟开门
- **班牌对接：** `GET /access-control/class-boards/{id}/display` 返回今日预约与使用状态（模拟协议）
- **批量审核：** `/lab-bookings/usage/pending` + `/lab-bookings/usage/batch-review`
- **前端页面：** `/lab-bookings`、`/lab-bookings/rules`、`/lab-bookings/usage-approval`、`/class-boards`

### 3.4 实验项目管理（模块 4）

- **核心实体：** `Course`、`ExperimentProject`
- **能力：** CRUD、批量复制、按课程/类型/学期统计

### 3.5 故障上报（模块 5）

- **核心实体：** `FaultReport`、`FaultHandlingRecord`
- **能力：** 在线上报（含视频附件）、二维码落地页、指派/处理/状态流转
- **统计分析：** 响应时效、处理时效、24h/72h SLA 达标数
- **推送：** 站内通知 + 微信/钉钉 Webhook（需配置 `WEBHOOK_URL`）

### 3.6 数据填报（模块 6）

- **核心实体：** `ReportTemplate`、`ReportSubmission`
- **能力：** 7 类教育部基表模板、在线填报、导入导出、汇总统计图表

### 3.7 数据对接与集成（模块 7）

- **适配器模式：** 6 类 JSON 适配器（人员/组织/资产/门禁/人脸/安全考试）
- **数据源：** `backend/data/integrations/*.json`
- **同步入口：** `POST /integrations/sync/{type}`

### 3.8 统计分析（模块 8）

- **API：** `/statistics/overview`、`/instrument-usage`、`/lab-usage`、`/equipment-value`
- **时间维度：** 本周/本月/本学期/本学年快捷预设 + 自定义日期范围

### 3.9 系统基础功能（模块 9）

- **RBAC：** system_admin / dept_admin / lab_admin / teacher / student / guest
- **SSO：** `/auth/sso/login` 本地 CAS/OIDC 流程
- **移动端：** H5 `/mobile/*`（非微信/钉钉原生小程序）
- **可视化大屏：** `/dashboard`，ECharts 趋势 + 安全/资产面板

### 3.10 智能体与接口（模块 10）

| 能力 | 实现 |
|------|------|
| REST Agent API | `/agent/*` — 6+ 查询端点 + Text-to-SQL |
| CopilotKit | 侧边栏 + 8 个 Remote Actions |
| MCP 协议 | `POST /api/v1/mcp` JSON-RPC + `GET /mcp/tools` |
| 知识库 | CRUD + FTS5 + **混合向量检索** `/knowledge/search/hybrid` |

### 3.11 银校收费（模块 ★11/12）

- **支付订单：** `PaymentOrder` + 确定性 `bank_ref` + `PaymentReceipt`
- **预约支付：** `POST /lab-bookings/{id}/pay`
- **对账：** 银行流水 JSON 适配器
- **限制：** 非生产中国银行 API，本地模拟支付流程

---

## 4. 数据模型概览

| 域 | 主要表 | 关系 |
|----|--------|------|
| 空间 | buildings, floors, rooms | 楼栋→楼层→房间 |
| 实验室 | labs, lab_staff, lab_changes | 实验室↔房间、管理员 |
| 仪器 | instruments, instrument_bookings | 仪器↔实验室 |
| 预约 | lab_bookings, lab_access_grants | 用户→实验室→门禁凭证 |
| 故障 | fault_reports, fault_handling_records | 实验室→处理记录 |
| 知识库 | knowledge_documents, knowledge_fts | FTS5 虚拟表 |
| 门禁 | access_control_devices, door_events | 设备↔实验室 |

---

## 5. 安全设计

- **认证：** JWT Bearer Token，登录 `/api/v1/auth/login`
- **授权：** 路由级 `require_roles()` 装饰器
- **数据隔离：** 学生角色仅可见自己的预约
- **Text-to-SQL：** 只读白名单表，禁止 DML
- **上传：** 扩展名白名单 + 大小限制（含视频 mp4/mov/webm）
- **CORS：** 开发环境允许 `localhost:5173`

---

## 6. 部署说明

### 6.1 开发环境启动

```bash
# 1. 初始化数据
cd backend && python3 -m scripts.reset_and_seed

# 2. 后端 API
python3 -m uvicorn src.main:app --reload --port 8000

# 3. CopilotKit 运行时（需 OPENAI_API_KEY）
cd copilot-runtime && npm start

# 4. 前端
cd frontend && npm run dev
```

### 6.2 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 系统管理员 |
| teacher1 | teacher123 | 教师 |
| student1 | student123 | 学生 |

### 6.3 环境变量

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | 数据库连接串 |
| `SECRET_KEY` | JWT 签名密钥 |
| `OPENAI_API_KEY` | CopilotKit LLM |
| `WECHAT_WEBHOOK_URL` | 微信推送 |
| `DINGTALK_WEBHOOK_URL` | 钉钉推送 |

---

## 7. API 端点统计

- **REST 端点：** 100+ （OpenAPI `/docs`）
- **新增端点（v0.3.1）：**
  - `GET /lab-bookings/usage/pending`
  - `POST /lab-bookings/usage/batch-review`
  - `GET /instrument-bookings/usage/pending`
  - `POST /instrument-bookings/usage/batch-review`
  - `GET /access-control/class-boards`
  - `GET /access-control/class-boards/{id}/display`
  - `POST /api/v1/mcp`
  - `GET /api/v1/mcp/tools`
  - `GET /knowledge/search/hybrid`

---

## 8. 已知限制与生产差距

| 编号 | 项目 | 当前状态 | 生产要求 |
|------|------|----------|----------|
| 3.8.1 | 电子班牌 | 模拟展示 API + 前端页面 | 硬件协议对接 |
| 9.4.1 | 移动端 | H5 移动版 | 微信/钉钉原生小程序 |
| 10.1.1 | MCP | HTTP JSON-RPC 子集 | 完整 MCP stdio/SSE |
| 10.2.2 | 向量检索 | TF-IDF 混合检索 | pgvector/Milvus embedding |
| 7.x | 外部对接 | JSON 适配器 | 实时 API 对接 |
| ★11/12 | 银校支付 | 本地模拟 | 中国银行生产网关 |

---

## 9. 版本变更记录（v0.3.1）

| 变更项 | 说明 |
|--------|------|
| 2.3.3 | 仪器规则页新增校外用户 `external_rules` 配置 |
| 3.1.2 | 实验室规则页新增按使用类型 `usage_type_rules` 配置 |
| 3.6.3 | 使用记录批量审核页面 + API |
| 3.7.2 | 统计页新增周/月/学期/学年快捷维度 |
| 5.3.1 | 故障统计新增响应/处理时效与 SLA 指标 |
| 5.1.1 | 故障上报支持视频附件上传 |
| 9.5.3 | 实验室巡查状态 UI 完整展示 |
| 3.8.1 | 电子班牌模拟展示（API + `/class-boards` 页面） |
| 10.1.1 | MCP JSON-RPC 端点 |
| 10.2.2 | 知识库混合向量检索 |

---

## 10. 参考文档

- [需求规格说明书](./requirements.md)
- [需求核对清单 V2](./requirements-checklist-v2.md)
- [需求审查报告](./requirements-review-report.md)
- [架构设计](./architecture.md)
