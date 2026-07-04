# LabOS 功能布局设计

> **版本：** v1.0.0  
> **依据：** requirements.md · IMPLEMENTED-FEATURES-ARCHIVE.md · interface-design Skill  
> **UI 方向：** Linear/Stripe 骨架 + OpenELIS 大屏 + Cal.com 预约

---

## 1. 全局 App Shell

### 1.1 结构

```
┌──────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (260px)  │  HEADER (56px, sticky)                           │
│  与 canvas 同色    │  [折叠] 页面标题          [助手] [通知] [用户]     │
│  border-right     ├──────────────────────────────────────────────────┤
│                   │  CONTENT (width: 100%, padding: 24px)            │
│  Logo             │  ┌────────────────────────────────────────────┐  │
│  ─────────        │  │  Page Header: 标题 + 描述 + Actions         │  │
│  分组导航          │  ├────────────────────────────────────────────┤  │
│  · 实验室管理      │  │  Filter Bar (可选)                           │  │
│  · 设备与预约      │  ├────────────────────────────────────────────┤  │
│  · 教学科研        │  │  Main Content (表格/表单/日历/图表)          │  │
│  · 运维管理        │  │  width: 100% — 禁止 max-width 限宽          │  │
│  · 系统           │  └────────────────────────────────────────────┘  │
│                   │                                                  │
└───────────────────┴──────────────────────────────────────────────────┘
```

**关键决策（回应用户痛点）：**

| 决策 | 值 | 原因 |
|------|-----|------|
| 侧边栏背景 | 与 canvas 同色 `#F8FAFC` | interface-design：不用「两个世界」 |
| 内容区宽度 | `100%`，无 max-width | 消除右侧 orphan 留白 |
| 侧边栏宽度 | 260px / 折叠 72px | 280px 说「导航服务 content」 |
| 顶栏高度 | 56px | Stripe 标准，低于旧 64px |

### 1.2 侧边栏导航分组

| 分组 | 路由 | 图标语义 |
|------|------|----------|
| **实验室管理** | | |
| 实验室 | `/labs` | building |
| 空间管理 | `/spaces` | layers |
| 实验员 | `/lab-staff` | users |
| 变更管理 | `/lab-changes` | git-branch |
| **设备与预约** | | |
| 仪器台账 | `/instruments` | microscope |
| 仪器预约 | `/instrument-bookings` | calendar-clock |
| 仪器规则 | `/instruments/rules` | settings-2 |
| 实验室预约 | `/lab-bookings` | door-open |
| 实验室规则 | `/lab-bookings/rules` | settings-2 |
| 使用记录审核 | `/lab-bookings/usage-approval` | clipboard-check |
| **教学科研** | | |
| 课程管理 | `/courses` | book-open |
| 实验项目 | `/experiment-projects` | flask |
| 科研实验 | `/experiments` | chart-line |
| **运维管理** | | |
| 故障上报 | `/faults` | alert-triangle |
| 数据填报 | `/data-reporting` | file-spreadsheet |
| 知识库 | `/knowledge` | search |
| **系统** | | |
| 可视化大屏 | `/dashboard` | layout-dashboard |
| 统计分析 | `/statistics` | bar-chart-3 |
| 系统对接 | `/integrations` | plug |
| 电子班牌 | `/class-boards` | monitor |
| 用户管理 | `/users` | user-cog |
| 收费管理 | `/payments` | credit-card |
| 移动端 | `/mobile` | smartphone |

**导航项规格：** 高 36px · 左 pad 12px · 图标 18px · 文字 14px/500 · 选中态 brand-subtle 背景 + brand 文字

### 1.3 RBAC 菜单裁剪

| 角色 | 可见分组 |
|------|----------|
| system_admin / dept_admin / lab_admin / teacher | 全部（teacher 隐藏用户/收费/对接） |
| student / guest | 实验室服务（实验室+知识库）· 设备与预约（只读+预约）· 运维（故障+移动端） |

**路由守卫：** 非法 URL 重定向至 `/labs`

---

## 2. 页面模板（5 种）

### Template A — CRUD 列表页（最高频）

**适用：** 实验室、仪器、实验员、用户、实验项目、故障、数据填报等 20+ 页面

```
┌─ Page Header ──────────────────────────────────────────────┐
│  实验项目                          [导出] [批量复制] [+新建]  │
│  课程实验项目与大纲指标管理                                   │
├─ Filter Bar ─────────────────────────────────────────────────┤
│  [🔍 搜索...]  [关联课程 ▾]  [项目类型 ▾]  [重置]            │
├─ Data Table (width: 100%) ───────────────────────────────────┤
│ ▌项目名称    │ 课程      │ 类型   │ 学时 │ 学期  │ 操作      │
│ ▌█ 物理实验一 │ PHY101   │ 验证   │ 2h  │ 2025春│ 编辑 删除  │  ← Status Rail
│ ▌  化学实验二 │ CHE201   │ 综合   │ 4h  │ 2025春│ 编辑 删除  │
├─ Pagination ─────────────────────────────────────────────────┤
│  共 128 条                              [< 上一页] [下一页 >] │
└──────────────────────────────────────────────────────────────┘
```

**规格：**
- Filter Bar：surface 卡片 · pad 16px · gap 12px · 搜索框 w-64 h-36px
- 表格：Status Rail 3px · 行高 44px · 表头 caption 11px uppercase
- Empty 状态：小图标 48px + 一行文字 + CTA 按钮（**禁止巨大图标**）
- Actions：primary 仅 1 个（新建），secondary 为导出/批量

### Template B — 详情 + 审批页

**适用：** 变更详情、故障详情、实验详情、预约详情

```
┌─ Page Header ──────────────────────────────────────────────┐
│  ← 返回    变更申请 #LC-2025-0042          [通过] [驳回]    │
├─ Two Column (2:1) ──────────────────────────────────────────┤
│  ┌─ Main (66%) ──────────────┐  ┌─ Sidebar (33%) ────────┐ │
│  │  Steps: 草稿→单位→中心→完成 │  │  申请信息              │ │
│  │  变更内容 Descriptions    │  │  申请人 / 时间 / 类型   │ │
│  │  审批记录 Timeline        │  │  关联实验室             │ │
│  └───────────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Template C — 表单页（新建/编辑）

**适用：** 实验室表单、仪器表单、实验项目表单、用户表单

```
┌─ Page Header ──────────────────────────────────────────────┐
│  ← 返回    新建实验室                      [取消] [保存]    │
├─ Form Card (max-w-3xl, 左对齐，非居中) ──────────────────────┤
│  基本信息 ─────────────────────                             │
│  实验室名称 *    [________________]                         │
│  编号 *          [________________]    开放状态  [开放 ▾]   │
│  ...                                                        │
│  位置信息 ─────────────────────                             │
│  楼栋            [选择 ▾]    楼层  [选择 ▾]                 │
└──────────────────────────────────────────────────────────────┘
```

**规格：** 表单 max-w-3xl 左对齐（非居中窄条）；字段间距 20px；section 标题 h3 16px/600

### Template D — 日历/预约页（Cal.com 风格）

**适用：** 仪器预约、实验室预约

```
┌─ Page Header ──────────────────────────────────────────────┐
│  仪器预约                              [+ 新建预约]        │
├─ View Toggle ────────────────────────────────────────────────┤
│  [列表] [日历] [时间轴]                                      │
├─ Calendar Grid ──────────────────────────────────────────────┤
│       周一    周二    周三    周四    周五                    │
│  08   ░░░    ████   ░░░    ░░░    ████                     │
│  10   ████   ████   ░░░    ████   ░░░                      │
│  14   ░░░    ░░░    ████   ░░░    ░░░                      │
│  ░ 空闲  █ 已预约  ▓ 维护中                                  │
└──────────────────────────────────────────────────────────────┘
```

**交互：** 点击空闲时段 → 右侧 Drawer 预约表单；已预约 hover 显示详情

### Template E — 可视化大屏（OpenELIS + Tremor）

**适用：** `/dashboard` 全宽无 sidebar

```
┌─ Full Viewport (无 sidebar, 无 padding) ─────────────────────┐
│  LabOS 运行态势          [院系 ▾] [时间 ▾]  更新于 16:42   │
├─ KPI Row (6 列, 每行 3 个避免中文折行) ──────────────────────┤
│  [实验室 42]  [设备 186]  [今日预约 23]                       │
│  [待审批 7]   [故障 2]    [使用率 78%]                        │
├─ Alert Banner (条件显示) ────────────────────────────────────┤
│  ⚠ 3 台仪器维护中 · 2 条预约待审批                           │
├─ Two Column ─────────────────────────────────────────────────┤
│  [预约动态 Timeline]          [设备使用率 Chart]              │
├─ Accordion (默认折叠) ───────────────────────────────────────┤
│  ▶ 故障统计详情                                               │
└──────────────────────────────────────────────────────────────┘
```

**规格：** KPI 卡片 metric 28px tabular-nums · label caption · 6 KPI 分 2 行 × 3 列

---

## 3. 登录页布局

**Template F — 登录（独立，无 App Shell）**

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─ Brand Panel (40%) ─────┐  ┌─ Login Form (60%) ─────────┐ │
│  │  LabOS                   │  │  登录 LabOS                │ │
│  │  实验室综合管理平台       │  │  用户名  [____________]    │ │
│  │                          │  │  密码    [____________]    │ │
│  │  · 12 大业务模块          │  │  [        登录        ]    │ │
│  │  · 87 项功能交付          │  │  演示: admin / admin123    │ │
│  └──────────────────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**规格：** 左 panel canvas 色 + 品牌信息 · 右 panel surface 表单 · 无渐变

---

## 4. 移动端 H5 布局

**Template G — Mobile Shell**

```
┌─ Mobile Header (48px) ──┐
│  LabOS          [菜单]   │
├─ Bottom Tab (5 items) ──┤
│  首页 | 预约 | 上报 | 我的 │
├─ Content ───────────────┤
│  (卡片列表，非表格)       │
└─────────────────────────┘
```

**可见模块：** 实验室列表 · 预约 · 故障上报 · 个人中心

---

## 5. 路由地图

| 路由 | 模板 | 模块 | 角色 |
|------|------|------|------|
| `/login` | F | 认证 | 全部 |
| `/dashboard` | E | M08 大屏 | admin+ |
| `/labs` | A | M01 | 全部 |
| `/labs/new`, `/labs/:id/edit` | C | M01 | admin+ |
| `/labs/:id` | B | M01 | 全部 |
| `/spaces` | A | M09 | admin+ |
| `/lab-staff` | A | M01 | admin+ |
| `/lab-changes` | A | M01 | admin+ |
| `/lab-changes/:id` | B | M01 | admin+ |
| `/instruments` | A | M02 | 全部 |
| `/instruments/rules` | C | M02 | admin+ |
| `/instrument-bookings` | D | M02 | 全部 |
| `/lab-bookings` | D | M03 | 全部 |
| `/lab-bookings/rules` | C | M03 | admin+ |
| `/lab-bookings/usage-approval` | A | M03 | admin+ |
| `/courses` | A | M04 | teacher+ |
| `/experiment-projects` | A | M04 | teacher+ |
| `/experiments` | A/B | M04 | teacher+ |
| `/faults` | A | M05 | 全部 |
| `/faults/:id` | B | M05 | admin+ |
| `/fault-report/:labId` | C | M05 | 公开 QR |
| `/data-reporting` | A | M06 | admin+ |
| `/statistics` | E | M08 | admin+ |
| `/integrations` | A | M07 | admin |
| `/knowledge` | A | M10 | 全部 |
| `/users` | A | M09 | admin |
| `/payments` | A | M11 | admin |
| `/class-boards` | B | M09 | admin+ |
| `/mobile/*` | G | M09 | student+ |

**共计：** 1 登录 + 1 大屏 + 25+ 业务路由 + 移动端

---

## 6. 组件清单（重建前端时需要）

| 组件 | 基于 | 用途 |
|------|------|------|
| `AppShell` | shadcn Sidebar | 全局布局 |
| `PageHeader` | 自定义 | 标题 + Actions |
| `FilterBar` | shadcn Input + Select | 列表筛选 |
| `DataTable` | TanStack Table + shadcn | 所有列表页 |
| `StatusRail` | 自定义（签名元素） | 行状态指示 |
| `KpiCard` | Tremor/shadcn Card | 大屏 KPI |
| `ApprovalSteps` | shadcn Steps | 审批流 |
| `BookingCalendar` | 自定义（Cal.com 参考） | 预约日历 |
| `FormSection` | shadcn Form + RHF | 所有表单 |
| `EmptyState` | 自定义（48px 图标上限） | 空数据 |
| `CommandPalette` | cmdk | 快捷导航（可选） |

---

## 7. 信息架构原则

1. **列表页默认排序：** 最新更新在前
2. **详情页面包屑：** 模块 > 列表 > 当前项
3. **审批动作：** 固定在 Page Header 右侧，primary=通过，destructive=驳回
4. **批量操作：** 表格勾选后 Filter Bar 下方出现浮动 Action Bar
5. **导出：** secondary 按钮，图标 16px，禁止 Ant Design 默认大图标
6. **智能助手：** 顶栏按钮触发 Drawer，非常驻悬浮（CopilotKit enableInspector=false）

---

## 8. 响应式断点

| 断点 | 行为 |
|------|------|
| ≥1280px | 完整 sidebar + 双栏详情 |
| 1024–1279px | sidebar 可折叠，表格水平滚动 |
| 768–1023px | sidebar 变 Drawer，单栏布局 |
| <768px | 跳转 Mobile Shell |
