# 实验室信息管理模块 — 领域设计

## 1. 概述

管理实验室物理场所的基础信息、变更审批和实验员关联，是设备管理、预约管理等模块的前置依赖。

## 2. 实体设计

### 2.1 空间层级（spaces 模块）

```
Building (楼栋)
  └── Floor (楼层)
        └── Room (房间/空间)
              └── Lab (实验室) [1:1 或 1:0..1]
```

| 实体 | 核心字段 |
|------|----------|
| Building | name, code, address, sort_order |
| Floor | building_id, name, floor_number, sort_order |
| Room | floor_id, name, code, area_sqm, room_type |

### 2.2 实验室（Lab）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| code | string(20) | 编号，唯一，自动生成 `LAB-{YYYY}-{SEQ}` |
| name | string(200) | 实验室名称 |
| room_id | UUID | 关联房间 |
| location_detail | string | 具体位置描述 |
| area_sqm | decimal | 面积（平方米） |
| functional_zones | JSONB | 功能分区列表 |
| capacity | int | 容纳人数 |
| lab_type | enum | 实验室类型 |
| manager_id | UUID | 责任负责人 |
| open_status | enum | 开放/关闭/维护中 |
| inspection_status | enum | 巡查状态 |
| description | text | 备注说明 |
| metadata | JSONB | 扩展字段 |

**实验室类型（lab_type）：**

- `teaching` — 教学实验室
- `research` — 科研实验室
- `comprehensive` — 综合实验室
- `innovation` — 创新实验室
- `training` — 实训中心

**开放状态（open_status）：**

- `open` — 开放
- `closed` — 关闭
- `maintenance` — 维护中

### 2.3 实验员（LabStaff）

| 字段 | 说明 |
|------|------|
| employee_no | 工号 |
| name | 姓名 |
| phone | 联系电话 |
| office_location | 办公室地点 |
| lab_ids | 责任管理实验室（多对多） |

## 3. API 设计

### 3.1 空间管理

```
GET/POST        /api/v1/buildings
GET/PATCH/DELETE /api/v1/buildings/{id}
GET/POST        /api/v1/buildings/{id}/floors
GET/POST        /api/v1/floors/{id}/rooms
```

### 3.2 实验室管理

```
GET    /api/v1/labs                    # 列表（多维筛选）
POST   /api/v1/labs                    # 创建
GET    /api/v1/labs/{id}               # 详情
PATCH  /api/v1/labs/{id}               # 更新
DELETE /api/v1/labs/{id}               # 软删除
POST   /api/v1/labs/import             # Excel 批量导入
GET    /api/v1/labs/export             # Excel 导出
```

**筛选参数：** building_id, floor_id, lab_type, open_status, keyword, manager_id

## 4. 导入导出格式

Excel 列定义：

| 列 | 字段 | 必填 |
|----|------|------|
| A | 实验室编号 | 否（空则自动生成） |
| B | 实验室名称 | 是 |
| C | 楼栋名称 | 是 |
| D | 楼层 | 是 |
| E | 房间编号 | 否 |
| F | 具体位置 | 否 |
| G | 面积 | 否 |
| H | 容纳人数 | 否 |
| I | 实验室类型 | 否 |
| J | 开放状态 | 否 |
| K | 负责人工号 | 否 |
| L | 备注 | 否 |

## 5. 变更管理（P0 后期 / P1）

变更申请实体 `LabChangeRequest`：

- 变更类型：功能调整、负责人变更、设备增减、区域划分
- 审批节点：所在单位审核 → 实验室管理中心审核
- 状态：pending_unit → pending_center → approved / rejected

## 6. 前端页面

| 页面 | 路由 |
|------|------|
| 实验室列表 | `/labs` |
| 新建/编辑 | `/labs/new`, `/labs/:id/edit` |
| 实验室详情 | `/labs/:id` |
| 空间管理 | `/settings/spaces` |
| 实验员管理 | `/lab-staff` |
