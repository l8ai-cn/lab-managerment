# LabOS Design System

> **版本：** v1.0.0  
> **方向代号：** Precision Campus（精确校园）  
> **参考：** Linear · Stripe Dashboard · shadcn-admin · OpenELIS Lab Dashboard · Cal.com  
> **Skill 依据：** interface-design · frontend-design · impeccable/craft

---

## 1. Domain Exploration（interface-design 必填）

### Domain — 实验室世界的 5+ 概念

| 概念 | 设计映射 |
|------|----------|
| 精密仪器 | 等宽数字、对齐严格的表格、刻度感间距 |
| 安全标识 | 状态色系统（可用/维护/故障/审批中） |
| 实验记录 | 时间轴、审批 Steps、操作留痕 |
| 校园空间 | 楼栋→楼层→房间层级导航 |
| 预约时段 | 日历网格、时段色块（Cal.com 交互） |
| 教育部基表 | 结构化表单、分区 Accordion |

### Color World — 实验室物理空间中的颜色

| 物理来源 | Token 映射 |
|----------|------------|
| 不锈钢台面 | `--surface` 冷白 |
| 蓝色安全标签 | `--brand` 主色 |
| 绿色「运行中」指示灯 | `--status-ready` |
| 琥珀色「维护中」警示 | `--status-maintenance` |
| 红色「故障/驳回」 | `--status-fault` |
| 灰色混凝土地面 | `--canvas` 背景 |
| 玻璃隔断反光 | `--border-subtle` 低透明度边框 |

### Signature — 产品独有视觉元素

**「Instrument Status Rail」仪器状态轨**

表格行、卡片、列表项左侧 3px 色条，颜色映射业务状态：

```
ready        → green   设备正常 / 预约已通过
pending      → blue    审批中 / 待处理
maintenance  → amber   维护中 / 草稿
fault        → rose    故障 / 已驳回
offline      → slate   停用 / 关闭
```

此元素贯穿仪器台账、预约列表、故障列表、变更审批，是 LabOS 的「签名」，替代 Ant Design 的 Tag 堆叠。

### Rejecting Defaults

| 默认选择 | 替代方案 |
|----------|----------|
| 深色侧边栏 + 浅色内容 | 侧边栏与画布同色 `#F8FAFC`，1px 右边框分隔 |
| Inter / 系统字体 | Geist（拉丁）+ Noto Sans SC（中文）+ IBM Plex Mono（编号） |
| 6 等宽 KPI 卡片网格 | OpenELIS 式：6 KPI + 下方双栏运营表 + Accordion 次要区 |
| max-width 限宽内容区 | 内容区 `width: 100%`，padding 24px，无 max-width |
| Ant Design Table 默认 | TanStack Table + 自定义密度 + Status Rail |

---

## 2. Design Tokens

### 2.1 Color Primitives

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `--canvas` | `#F8FAFC` | `#0B0F14` | 页面背景 |
| `--surface` | `#FFFFFF` | `#111827` | 卡片/面板 |
| `--surface-raised` | `#FFFFFF` | `#1A2332` | 下拉/Popover（+1 级） |
| `--surface-inset` | `#F1F5F9` | `#0F172A` | 输入框内凹背景 |
| `--ink-primary` | `#0F172A` | `#F1F5F9` | 主文字 |
| `--ink-secondary` | `#475569` | `#94A3B8` | 次要文字 |
| `--ink-tertiary` | `#64748B` | `#64748B` | 标签/元数据 |
| `--ink-muted` | `#94A3B8` | `#475569` | 禁用/占位 |
| `--border-default` | `rgba(15,23,42,0.08)` | `rgba(255,255,255,0.08)` | 标准边框 |
| `--border-subtle` | `rgba(15,23,42,0.05)` | `rgba(255,255,255,0.05)` | 弱分隔 |
| `--border-strong` | `rgba(15,23,42,0.12)` | `rgba(255,255,255,0.12)` | 强调边界 |
| `--brand` | `#2563EB` | `#3B82F6` | 主操作/链接 |
| `--brand-hover` | `#1D4ED8` | `#2563EB` | 主操作 hover |
| `--brand-subtle` | `#EFF6FF` | `#1E3A5F` | 主色浅底 |
| `--status-ready` | `#059669` | `#34D399` | 正常/通过 |
| `--status-ready-subtle` | `#ECFDF5` | `#064E3B` | |
| `--status-pending` | `#2563EB` | `#60A5FA` | 审批中 |
| `--status-pending-subtle` | `#EFF6FF` | `#1E3A5F` | |
| `--status-maintenance` | `#D97706` | `#FBBF24` | 维护/草稿 |
| `--status-maintenance-subtle` | `#FFFBEB` | `#78350F` | |
| `--status-fault` | `#E11D48` | `#FB7185` | 故障/驳回 |
| `--status-fault-subtle` | `#FFF1F2` | `#881337` | |
| `--status-offline` | `#64748B` | `#94A3B8` | 停用/关闭 |
| `--focus-ring` | `rgba(37,99,235,0.24)` | `rgba(59,130,246,0.32)` | 焦点环 |

**60/30/10 分布：** 60% 中性 surface/canvas · 30% ink 层级 · 10% brand + status 语义色

### 2.2 Typography

**字体栈：**

```css
--font-sans: "Geist", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: "IBM Plex Mono", "Geist Mono", "Noto Sans Mono SC", monospace;
```

**比例：** Minor Third（1.2），基准 14px

| Token | Size | Weight | Line | Tracking | 用途 |
|-------|------|--------|------|----------|------|
| `--text-display` | 28px | 600 | 1.2 | -0.02em | 大屏标题 |
| `--text-h1` | 22px | 600 | 1.25 | -0.01em | 页面标题 |
| `--text-h2` | 18px | 600 | 1.3 | 0 | 区块标题 |
| `--text-h3` | 16px | 600 | 1.35 | 0 | 卡片标题 |
| `--text-body` | 14px | 400 | 1.5 | 0 | 正文 |
| `--text-body-medium` | 14px | 500 | 1.5 | 0 | 表格单元格 |
| `--text-label` | 12px | 500 | 1.4 | 0.02em | 表单标签 |
| `--text-caption` | 11px | 500 | 1.4 | 0.04em | KPI 标签、表头 |
| `--text-metric` | 28px | 600 | 1.1 | -0.02em | KPI 数值（tabular-nums） |

**层级策略（Linear 式）：** 同 14px 通过 weight + opacity 分三级，而非仅靠字号。

### 2.3 Spacing（4px 基准）

| Token | Value | 用途 |
|-------|-------|------|
| `--space-1` | 4px | 图标间隙 |
| `--space-2` | 8px | 紧凑组内 |
| `--space-3` | 12px | 按钮内边距、表格行 |
| `--space-4` | 16px | 卡片内边距 |
| `--space-5` | 20px | 表单字段间距 |
| `--space-6` | 24px | 页面边距、区块内 |
| `--space-8` | 32px | 区块间 |
| `--space-12` | 48px | 大区块分隔 |
| `--space-16` | 64px | 页面级分隔 |

**密度决策：**
- 表格行高：40px（紧凑）/ 48px（默认）
- 侧边栏项高：36px
- 顶栏高：56px
- 表单字段间距：20px

### 2.4 Radius

| Token | Value | 用途 |
|-------|-------|------|
| `--radius-sm` | 6px | 按钮、输入框、Tag |
| `--radius-md` | 8px | 卡片、下拉 |
| `--radius-lg` | 12px | 模态框、Drawer |
| `--radius-full` | 9999px | 头像、药丸 Badge |

**同心圆规则：** `outerRadius = innerRadius + padding`

### 2.5 Elevation & Depth

**策略：** Borders-only（Linear 式），light mode 辅以极轻 shadow

| Level | Light | Dark |
|-------|-------|------|
| 0 base | canvas | canvas |
| 1 surface | 1px border-subtle | 1px border-subtle |
| 2 raised | border + `0 1px 2px rgba(0,0,0,0.04)` | border-strong only |
| 3 overlay | border + `0 4px 16px rgba(0,0,0,0.08)` | border + `0 0 0 1px rgba(255,255,255,0.08)` |

**输入框：** `--surface-inset`（比周围暗一级），非 lighter

### 2.6 Motion

| Token | Value | 用途 |
|-------|-------|------|
| `--duration-instant` | 100ms | 按钮 press |
| `--duration-fast` | 150ms | hover、tooltip |
| `--duration-normal` | 200ms | dropdown、sidebar collapse |
| `--duration-slow` | 300ms | modal、drawer |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | 进入 |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | 位移 |

**规则：** 仅 animate `transform` + `opacity`；高频操作（表格排序）无动画。

### 2.7 Layout Tokens

| Token | Value | 说明 |
|-------|-------|------|
| `--sidebar-width` | 260px | 展开宽度 |
| `--sidebar-collapsed` | 72px | 折叠宽度 |
| `--header-height` | 56px | 顶栏 |
| `--content-padding` | 24px | 内容区内边距 |
| `--table-min-width` | 100% | 表格撑满，禁止 orphan 留白 |

### 2.8 Component Tokens

| 组件 | 规格 |
|------|------|
| Button primary | h 36px · pad 12px 16px · radius-sm · 14px/500 |
| Button secondary | h 36px · border-default · bg surface |
| Button ghost | h 36px · hover surface-inset |
| Input | h 36px · pad 8px 12px · bg surface-inset · radius-sm |
| Select | 同 Input · chevron 16px |
| Table header | h 40px · 11px/500/caption · bg canvas |
| Table row | h 44px · 14px/500 · Status Rail 3px left |
| Badge | h 22px · pad 4px 8px · radius-sm · caption |
| KPI card | pad 16px · metric 28px/600 · label caption |

---

## 3. shadcn/ui 映射

重建前端时，Tailwind/shadcn 主题映射：

```css
--background: var(--canvas);
--foreground: var(--ink-primary);
--card: var(--surface);
--card-foreground: var(--ink-primary);
--primary: var(--brand);
--primary-foreground: #FFFFFF;
--secondary: var(--surface-inset);
--muted: var(--surface-inset);
--muted-foreground: var(--ink-tertiary);
--accent: var(--brand-subtle);
--destructive: var(--status-fault);
--border: var(--border-default);
--input: var(--border-default);
--ring: var(--focus-ring);
--radius: 6px;
```

---

## 4. 文件索引

| 文件 | 说明 |
|------|------|
| [tokens.css](./tokens.css) | CSS Custom Properties（可直接 import） |
| [tokens.ts](./tokens.ts) | TypeScript 常量（Tailwind 扩展用） |
| [layout.md](./layout.md) | 功能布局与信息架构 |
| [PRODUCT.md](./PRODUCT.md) | 产品上下文 |
| [../../.interface-design/system.md](../../.interface-design/system.md) | Agent 运行时设计系统 |
