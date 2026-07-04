# LabOS Interface Design System

> Agent 运行时设计系统 · 由 interface-design Skill 维护  
> **方向：** Precision Campus · **版本：** v1.0.0 · **日期：** 2026-07-04

## Direction & Feel

**Precision Campus** — 高校实验室管理的专业后台。精确（对齐/等宽数字）、可信（校方采购级克制）、高效（Linear 密度）。

- **Register:** product（后台/dashboard，非营销页）
- **References:** Linear · Stripe Dashboard · shadcn-admin · OpenELIS Lab Dashboard · Cal.com
- **Anti:** Ant Design 默认 · 巨大 Empty 图标 · max-width 留白 · 渐变装饰

## Domain

实验室 · 精密仪器 · 安全标识 · 实验记录 · 校园空间 · 预约时段 · 教育部基表

## Signature

**Instrument Status Rail** — 列表/表格/卡片左侧 3px 色条，映射 ready/pending/maintenance/fault/offline 五态。

## Depth Strategy

Borders-only（Linear 式）。Light mode 极轻 shadow-sm 用于 raised 层。Sidebar 与 canvas 同色，border-right 分隔。

## Spacing Base

4px 网格。表格区紧凑 12–16px，区块间 48px。

## Hierarchy

- Type scale: Minor Third 1.2, base 14px
- Weight + opacity 分三级（Linear 式），非仅靠字号
- 一屏一焦点：列表页 focal = DataTable；大屏 focal = KPI row

## Typography

- Sans: Geist + Noto Sans SC
- Mono: IBM Plex Mono（编号/指标）
- 禁止: Inter, Roboto, Arial, Space Grotesk

## Color Palette

| Role | Light |
|------|-------|
| canvas | #F8FAFC |
| surface | #FFFFFF |
| brand | #2563EB |
| ink-primary | #0F172A |
| status-ready | #059669 |
| status-fault | #E11D48 |

Full tokens: `docs/design/tokens.css`

## Layout

- Sidebar: 260px / 72px collapsed, same bg as canvas
- Header: 56px sticky
- Content: width 100%, padding 24px, **NO max-width**
- 5 page templates: CRUD List · Detail+Approval · Form · Calendar · Dashboard

Full layout: `docs/design/layout.md`

## Component Patterns

| Component | Spec |
|-----------|------|
| Button primary | 36h · 12/16 pad · radius-sm · 14/500 |
| Input | 36h · inset bg · radius-sm |
| Table row | 44h · Status Rail 3px · tabular-nums |
| KPI card | metric 28/600 · label caption 11px |
| Empty state | icon max 48px · one line + CTA |

## Motion

- Duration: 100–300ms, ease-out only
- High-frequency ops (sort, filter): no animation
- prefers-reduced-motion: opacity only

## Tech Stack (planned rebuild)

React 18 · Vite · TypeScript · shadcn/ui · Tailwind CSS v4 · TanStack Table · TanStack Query

## Files

- `docs/design/PRODUCT.md` — 产品上下文
- `docs/design/DESIGN.md` — 完整 Token 文档
- `docs/design/tokens.css` — CSS 变量
- `docs/design/tokens.ts` — TS 常量
- `docs/design/layout.md` — 功能布局
