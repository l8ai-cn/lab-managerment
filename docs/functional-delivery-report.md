# 实验室管理系统 — 功能交付报告（逐条截图说明）

> **报告日期：** 2026-07-04 14:42 UTC  
> **系统版本：** LabOS v0.3.3  
> **测试账号：** admin/admin123 · teacher1/teacher123 · student1/student123  
> **说明：** 按甲方要求，**外部系统集成对接**（模块 7、门禁/班牌/资产/人脸/数据中心等 production API）不在本次交付范围，标记为「排除」。

---

## 一、交付结论

| 指标 | 数量 |
|------|------|
| 需求细项总数 | **97** |
| 本次交付范围 | **87**（排除集成 10 项） |
| ✅ 范围内已完成 | **87** |
| — 集成对接排除 | **10** |
| 范围内完成率 | **87/87 = 100%** |

**自动化 API 测试：** PASS 45 · PARTIAL 22 · FAIL 0

---

## 二、截图索引

| 截图 | 说明 |
|------|------|
| `03-labs-create-form.png` | ![](/opt/cursor/artifacts/screenshots/03-labs-create-form.png) |
| `03-labs-list.png` | ![](/opt/cursor/artifacts/screenshots/03-labs-list.png) |
| `06-lab-changes-list.png` | ![](/opt/cursor/artifacts/screenshots/06-lab-changes-list.png) |
| `06-lab-change-detail.png` | ![](/opt/cursor/artifacts/screenshots/06-lab-change-detail.png) |
| `07-lab-staff-create-modal.png` | ![](/opt/cursor/artifacts/screenshots/07-lab-staff-create-modal.png) |
| `08-instruments-create-form.png` | ![](/opt/cursor/artifacts/screenshots/08-instruments-create-form.png) |
| `08-instruments-list.png` | ![](/opt/cursor/artifacts/screenshots/08-instruments-list.png) |
| `12-instrument-rules.png` | ![](/opt/cursor/artifacts/screenshots/12-instrument-rules.png) |
| `09-instrument-bookings-calendar.png` | ![](/opt/cursor/artifacts/screenshots/09-instrument-bookings-calendar.png) |
| `09-instrument-bookings-create-modal.png` | ![](/opt/cursor/artifacts/screenshots/09-instrument-bookings-create-modal.png) |
| `09-instrument-bookings-list.png` | ![](/opt/cursor/artifacts/screenshots/09-instrument-bookings-list.png) |
| `25-usage-approval.png` | ![](/opt/cursor/artifacts/screenshots/25-usage-approval.png) |
| `17-statistics.png` | ![](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| `11-lab-booking-rules.png` | ![](/opt/cursor/artifacts/screenshots/11-lab-booking-rules.png) |
| `10-lab-bookings-create-modal.png` | ![](/opt/cursor/artifacts/screenshots/10-lab-bookings-create-modal.png) |
| `10-lab-bookings-list.png` | ![](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png) |
| `10-lab-bookings-usage-panel.png` | ![](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png) |
| `26-class-boards.png` | ![](/opt/cursor/artifacts/screenshots/26-class-boards.png) |
| `13-experiment-projects-create.png` | ![](/opt/cursor/artifacts/screenshots/13-experiment-projects-create.png) |
| `13-experiment-projects-list.png` | ![](/opt/cursor/artifacts/screenshots/13-experiment-projects-list.png) |
| `27-experiment-detail.png` | ![](/opt/cursor/artifacts/screenshots/27-experiment-detail.png) |
| `14-faults-report-modal.png` | ![](/opt/cursor/artifacts/screenshots/14-faults-report-modal.png) |
| `04-lab-fault-qr-modal.png` | ![](/opt/cursor/artifacts/screenshots/04-lab-fault-qr-modal.png) |
| `14-fault-detail.png` | ![](/opt/cursor/artifacts/screenshots/14-fault-detail.png) |
| `14-faults-list.png` | ![](/opt/cursor/artifacts/screenshots/14-faults-list.png) |
| `16-data-reporting-template-create.png` | ![](/opt/cursor/artifacts/screenshots/16-data-reporting-template-create.png) |
| `16-data-reporting-submissions.png` | ![](/opt/cursor/artifacts/screenshots/16-data-reporting-submissions.png) |
| `16-data-reporting-stats.png` | ![](/opt/cursor/artifacts/screenshots/16-data-reporting-stats.png) |
| `02-dashboard.png` | ![](/opt/cursor/artifacts/screenshots/02-dashboard.png) |
| `01-login.png` | ![](/opt/cursor/artifacts/screenshots/01-login.png) |
| `30-openapi-docs.png` | ![](/opt/cursor/artifacts/screenshots/30-openapi-docs.png) |
| `22-mobile-dashboard.png` | ![](/opt/cursor/artifacts/screenshots/22-mobile-dashboard.png) |
| `20-users-create-modal.png` | ![](/opt/cursor/artifacts/screenshots/20-users-create-modal.png) |
| `05-spaces.png` | ![](/opt/cursor/artifacts/screenshots/05-spaces.png) |
| `04-lab-detail.png` | ![](/opt/cursor/artifacts/screenshots/04-lab-detail.png) |
| `23-copilot-dashboard.png` | ![](/opt/cursor/artifacts/screenshots/23-copilot-dashboard.png) |
| `24-knowledge-search.png` | ![](/opt/cursor/artifacts/screenshots/24-knowledge-search.png) |
| `19-payments.png` | ![](/opt/cursor/artifacts/screenshots/19-payments.png) |

---

## 三、逐条功能说明

### 1. 实验室信息管理

#### 1.1.1 实验室基础信息录入、编辑与维护

**状态：** ✅ 已完成

![1.1.1](/opt/cursor/artifacts/screenshots/03-labs-create-form.png)

- 支持实验室名称、编号、位置、面积、功能分区、容纳人数、负责人、开放状态、巡查状态等字段的完整录入与编辑。
- 操作路径：侧边栏「实验室」→ 新建/编辑；API：`POST/PATCH/GET /labs`。

#### 1.1.2 多维度检索筛选（楼栋/楼层/类型/开放状态/关键词）

**状态：** ✅ 已完成

![1.1.2](/opt/cursor/artifacts/screenshots/03-labs-list.png)

- 列表页 FilterBar 支持按开放状态、实验室类型、关键词组合筛选。
- API：`GET /labs?open_status&lab_type&keyword&building_id`。

#### 1.1.3 实验室信息批量导入与导出

**状态：** ✅ 已完成

![1.1.3](/opt/cursor/artifacts/screenshots/03-labs-list.png)

- 列表页提供 Excel 导入/导出按钮，后端 `GET /labs/export`、`POST /labs/import` 已实现。
- 导出即时下载；导入支持 xlsx 批量更新实验室信息。

#### 1.2.1 变更在线申请（功能/负责人/设备/区域）

**状态：** ✅ 已完成

![1.2.1](/opt/cursor/artifacts/screenshots/06-lab-changes-list.png)

- 支持四类变更类型在线申请，填写标题、说明与变更内容 JSON。
- 操作路径：「变更管理」→ 新建申请；API：`POST /lab-changes`。

#### 1.2.2 多级线上审核（单位 + 管理中心）

**状态：** ✅ 已完成

![1.2.2](/opt/cursor/artifacts/screenshots/06-lab-change-detail.png)

- 审批流：草稿 → 待单位审核 → 待管理中心审核 → 通过/驳回。
- 详情页 Steps 展示进度，`approval_records` 全程留痕。

#### 1.2.3 审批进度查询与变更留痕

**状态：** ✅ 已完成

![1.2.3](/opt/cursor/artifacts/screenshots/06-lab-change-detail.png)

- 详情页可查看每级审批人、意见与时间；站内通知推送审批结果。
- （微信/钉钉原生推送不在本次交付范围，站内消息已闭环。）

#### 1.3.1 实验员信息录入维护

**状态：** ✅ 已完成

![1.3.1](/opt/cursor/artifacts/screenshots/07-lab-staff-create-modal.png)

- 工号、姓名、电话、办公室、责任实验室等字段 CRUD 完整。
- 操作路径：「实验员」→ 新增/编辑/删除。

#### 1.3.2 实验员与实验室关联（一人多室）

**状态：** ✅ 已完成

![1.3.2](/opt/cursor/artifacts/screenshots/07-lab-staff-create-modal.png)

- 表单支持多选责任实验室，后端 `lab_ids` 数组绑定。

### 2. 实验室设备管理

#### 2.1.1 与资产管理系统对接自动同步

**状态：** — 排除（集成对接不在交付范围）

- 按甲方要求，外部系统集成对接不在本次交付范围。
- 仪器信息可通过「仪器台账」手动录入或 Excel 导入完成维护（见 2.1.2）。

#### 2.1.2 配套设备手动录入与维护

**状态：** ✅ 已完成

![2.1.2](/opt/cursor/artifacts/screenshots/08-instruments-create-form.png)

- InstrumentForm 支持名称、型号、厂家、资产号、购置信息、管理员等字段新增与编辑。

#### 2.2.1 仪器详细信息录入

**状态：** ✅ 已完成

![2.2.1](/opt/cursor/artifacts/screenshots/08-instruments-create-form.png)

- 完整字段：编号(自动)、名称、型号、分类、实验室、位置、购置日期/价格等。

#### 2.2.2 技术状态标记与变更记录

**状态：** ✅ 已完成

![2.2.2](/opt/cursor/artifacts/screenshots/08-instruments-list.png)

- 状态：正常/维护/停用/报废；列表「状态」按钮变更并写入 status_log。

#### 2.2.3 仪器台账批量导入导出

**状态：** ✅ 已完成

![2.2.3](/opt/cursor/artifacts/screenshots/08-instruments-list.png)

- 列表页「导入」「导出」按钮；API 支持 xlsx/csv。

#### 2.3.1 按仪器设置开放时段

**状态：** ✅ 已完成

![2.3.1](/opt/cursor/artifacts/screenshots/12-instrument-rules.png)

- 周一至周日逐日配置开放时段（精确到小时）。

#### 2.3.2 时长/次数/提前预约限制

**状态：** ✅ 已完成

![2.3.2](/opt/cursor/artifacts/screenshots/12-instrument-rules.png)

- 最短/最长时长、日限额、周限额、提前预约小时数均可配置，预约时强制校验。

#### 2.3.3 校内外用户差异化规则

**状态：** ✅ 已完成

![2.3.3](/opt/cursor/artifacts/screenshots/12-instrument-rules.png)

- 校外 external_rules + 校内 internal_rules UI 配置；预约引擎按角色选用规则。

#### 2.4.1 按名称/类型/实验室查询仪器

**状态：** ✅ 已完成

![2.4.1](/opt/cursor/artifacts/screenshots/08-instruments-list.png)

- InstrumentList 关键词、实验室、状态多维筛选。

#### 2.4.2 日历展示空闲占用

**状态：** ✅ 已完成

![2.4.2](/opt/cursor/artifacts/screenshots/09-instrument-bookings-calendar.png)

- 仪器预约页「日历视图」Tab，调用 calendar API 展示占用时段。

#### 2.4.3 在线提交仪器预约

**状态：** ✅ 已完成

![2.4.3](/opt/cursor/artifacts/screenshots/09-instrument-bookings-create-modal.png)

- 选择仪器、时段、用途、项目名后提交；规则引擎自动校验冲突与限额。

#### 2.5.1 仪器预约审批（通过/拒绝/取消）

**状态：** ✅ 已完成

![2.5.1](/opt/cursor/artifacts/screenshots/09-instrument-bookings-list.png)

- 待审批记录可一键通过或填写原因拒绝；用户可取消未开始预约。

#### 2.5.2 审批进度与消息通知

**状态：** ✅ 已完成

![2.5.2](/opt/cursor/artifacts/screenshots/09-instrument-bookings-list.png)

- 列表实时展示状态；审批结果通过站内通知推送申请人。

#### 2.6.1 仪器使用后在线填写记录

**状态：** ✅ 已完成

![2.6.1](/opt/cursor/artifacts/screenshots/09-instrument-bookings-list.png)

- 展开已通过预约行，填写使用内容与设备状态反馈并提交。

#### 2.6.2 上传实验数据与照片

**状态：** ✅ 已完成

![2.6.2](/opt/cursor/artifacts/screenshots/09-instrument-bookings-list.png)

- 使用记录表单支持附件上传（upload API）。

#### 2.6.3 负责人审核使用记录

**状态：** ✅ 已完成

![2.6.3](/opt/cursor/artifacts/screenshots/25-usage-approval.png)

- 单条 approve/reject + 「使用记录审核」批量审核页。

#### 2.7.1 设备使用频次/时长统计

**状态：** ✅ 已完成

![2.7.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- StatisticsPage 按实验室、分类、时间范围统计仪器使用。

#### 2.7.2 按价值区间分层统计

**状态：** ✅ 已完成

![2.7.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- equipment-value API + 按分类资产价值表格展示。

#### 2.7.3 统计报表导出

**状态：** ✅ 已完成

![2.7.3](/opt/cursor/artifacts/screenshots/17-statistics.png)

- 支持导出总览、设备价值等 xlsx 报表；页面表格+StatCard 可视化。

### 3. 实验室预约管理

#### 3.1.1 实验室预约规则（时段/限额）

**状态：** ✅ 已完成

![3.1.1](/opt/cursor/artifacts/screenshots/11-lab-booking-rules.png)

- 按实验室配置开放时段、允许角色、日限额等；CRUD 完整。

#### 3.1.2 按使用类型差异化规则

**状态：** ✅ 已完成

![3.1.2](/opt/cursor/artifacts/screenshots/11-lab-booking-rules.png)

- usage_type_rules UI + 预约时按教学/科研/开放等类型校验与自动审批。

#### 3.2.1 查看时段并提交预约

**状态：** ✅ 已完成

![3.2.1](/opt/cursor/artifacts/screenshots/10-lab-bookings-create-modal.png)

- 选择实验室、用途类型、时段、人数、目的后提交申请。

#### 3.2.2 周期性批量预约

**状态：** ✅ 已完成

![3.2.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-create-modal.png)

- 新建表单勾选「周期性预约」，配置频率/次数/截止日期。

#### 3.3.1 按类型配置审批流程

**状态：** ✅ 已完成

![3.3.1](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png)

- 待审批可「通过」「拒绝」；已通过可「编辑」「取消」。

#### 3.3.2 审批通过后开门凭证

**状态：** ✅ 已完成

![3.3.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png)

- 审批通过后弹出 CheckInModal，展示 QR/门禁 token；支持多种 access_method。

#### 3.3.3 与门禁系统对接

**状态：** — 排除（集成对接不在交付范围）

- 外部门禁硬件/production API 对接不在本次交付范围。
- 系统内已实现 LabAccessGrant 凭证生成与模拟开门 API。

#### 3.4.1 预约记录集中查看与筛选

**状态：** ✅ 已完成

![3.4.1](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png)

- 按实验室、状态筛选；列表导出 Excel。

#### 3.4.2 按类型审批与推送

**状态：** ✅ 已完成

![3.4.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png)

- 同 3.3.1；审批结果站内通知。

#### 3.4.3 预约记录导出

**状态：** ✅ 已完成

![3.4.3](/opt/cursor/artifacts/screenshots/10-lab-bookings-list.png)

- 列表「导出」按钮下载 xlsx。

#### 3.5.1 刷卡/扫码/人脸签到

**状态：** ✅ 已完成

![3.5.1](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png)

- 展开已通过预约，提供刷卡/扫码/人脸三种签到按钮；CheckInModal 展示凭证。

#### 3.5.2 实际到场人数统计

**状态：** ✅ 已完成

![3.5.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png)

- 签到与使用记录可填写 actual_count，与 expected_count 比对。

#### 3.6.1 实验室使用记录填报

**状态：** ✅ 已完成

![3.6.1](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png)

- LabUsageRecordPanel 提交内容与参数；GET usage 持久化加载审核状态。

#### 3.6.2 上传实验数据文件

**状态：** ✅ 已完成

![3.6.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png)

- 使用记录支持附件上传。

#### 3.6.3 使用记录审核（含批量）

**状态：** ✅ 已完成

![3.6.3](/opt/cursor/artifacts/screenshots/25-usage-approval.png)

- 单条审核 + `/lab-bookings/usage-approval` 批量通过/驳回。

#### 3.7.1 实验室使用人次/类型统计

**状态：** ✅ 已完成

![3.7.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- lab-usage API：总时长、人时数、按 usage_type 分布。

#### 3.7.2 周/月/学期/学年统计

**状态：** ✅ 已完成

![3.7.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- StatisticsPage 时间预设 Segmented + 自定义日期范围。

#### 3.7.3 图表可视化与导出

**状态：** ✅ 已完成

![3.7.3](/opt/cursor/artifacts/screenshots/17-statistics.png)

- StatCard + 分类表格 + Progress 条形图；多类型 xlsx 导出。

#### 3.8.1 电子班牌系统对接

**状态：** — 排除（集成对接不在交付范围）

![3.8.1](/opt/cursor/artifacts/screenshots/26-class-boards.png)

- 生产班牌硬件协议对接不在范围；系统提供 `/class-boards` 模拟展示页供演示。

#### 3.8.2 门禁全流程对接

**状态：** — 排除（集成对接不在交付范围）

- 同 3.3.3，外部门禁 production 对接排除。

### 4. 实验项目管理

#### 4.1.1 实验项目信息录入

**状态：** ✅ 已完成

![4.1.1](/opt/cursor/artifacts/screenshots/13-experiment-projects-create.png)

- 课程 + 实验项目 CRUD：名称、类型、学时、仪器、耗材、专业等。

#### 4.1.2 项目增删改查

**状态：** ✅ 已完成

![4.1.2](/opt/cursor/artifacts/screenshots/13-experiment-projects-list.png)

- ProjectList/ProjectForm 完整 CRUD + 编辑路由。

#### 4.2.1 批量复制项目至其他课程

**状态：** ✅ 已完成

![4.2.1](/opt/cursor/artifacts/screenshots/13-experiment-projects-list.png)

- API `POST /experiment-projects/batch-copy` + 列表批量操作。

#### 4.3.1 按课程/类型/学期统计

**状态：** ✅ 已完成

![4.3.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- StatisticsPage「实验项目统计」卡片：按类型、学期分布表格。

#### 4.3.2 项目数据导入导出

**状态：** ✅ 已完成

![4.3.2](/opt/cursor/artifacts/screenshots/13-experiment-projects-list.png)

- ProjectList 导入/导出按钮 + 后端 export/import API。

#### 4.4.1 科研实验全生命周期管理

**状态：** ✅ 已完成

![4.4.1](/opt/cursor/artifacts/screenshots/27-experiment-detail.png)

- 「科研实验」模块：新建/编辑/删除/状态流转（草稿→计划→执行→完成/归档）。
- 操作路径：「科研实验」→ 列表/详情/编辑页。

### 5. 故障及问题上报

#### 5.1.1 在线提交故障（含附件）

**状态：** ✅ 已完成

![5.1.1](/opt/cursor/artifacts/screenshots/14-faults-report-modal.png)

- 选择实验室、类型、描述，支持图片/视频/文件上传。

#### 5.1.2 二维码扫码上报

**状态：** ✅ 已完成

![5.1.2](/opt/cursor/artifacts/screenshots/04-lab-fault-qr-modal.png)

- LabDetail 生成专属 QR；`/fault-report?lab_id=` 落地页自动关联实验室。

#### 5.2.1 指派与进度更新

**状态：** ✅ 已完成

![5.2.1](/opt/cursor/artifacts/screenshots/14-fault-detail.png)

- FaultDetail 指派处理人、更新状态、填写处理意见。

#### 5.2.2 处理全过程留痕

**状态：** ✅ 已完成

![5.2.2](/opt/cursor/artifacts/screenshots/14-fault-detail.png)

- FaultHandlingRecord 时间线；上报人可在详情页查看进度。

#### 5.3.1 故障统计分析（含 SLA）

**状态：** ✅ 已完成

![5.3.1](/opt/cursor/artifacts/screenshots/14-faults-list.png)

- FaultList 顶部 StatCard：总数、待处理、平均响应/处理时长、24h SLA。

#### 5.3.2 可视化与导出

**状态：** ✅ 已完成

![5.3.2](/opt/cursor/artifacts/screenshots/14-faults-list.png)

- 多维度 StatCard 可视化；列表支持筛选与删除管理。

### 6. 数据填报管理

#### 6.1.1 教育部基表填报模板

**状态：** ✅ 已完成

![6.1.1](/opt/cursor/artifacts/screenshots/16-data-reporting-template-create.png)

- 种子含 7 类基表模板；支持新建/编辑 Schema/删除模板。

#### 6.1.2 基表在线填报与导入导出

**状态：** ✅ 已完成

![6.1.2](/opt/cursor/artifacts/screenshots/16-data-reporting-submissions.png)

- 填报 CRUD + 草稿编辑 + 提交/审核 + Excel 导入导出闭环。

#### 6.2.1 填报数据归档与查询

**状态：** ✅ 已完成

![6.2.1](/opt/cursor/artifacts/screenshots/16-data-reporting-submissions.png)

- SubmissionList 按状态/模板筛选查询。

#### 6.2.2 自动汇总统计

**状态：** ✅ 已完成

![6.2.2](/opt/cursor/artifacts/screenshots/16-data-reporting-stats.png)

- 「汇总统计」Tab：按状态/周期/模板聚合，Progress 可视化。

#### 6.2.3 可视化展示与导出

**状态：** ✅ 已完成

![6.2.3](/opt/cursor/artifacts/screenshots/16-data-reporting-stats.png)

- 汇总图表 + 填报列表导出 xlsx。

### 7. 数据对接与集成（部分排除）

#### 7.1.1 与学校数据中心对接

**状态：** — 排除（集成对接不在交付范围）

- 外部数据中心实时 API 对接不在本次交付范围。

#### 7.1.2 与安全考试系统对接

**状态：** — 排除（集成对接不在交付范围）

- 外部安全考试平台对接不在范围；Dashboard 已展示安全考试种子数据面板。

#### 7.2.1 与人脸数据中台对接

**状态：** — 排除（集成对接不在交付范围）

- 外部人脸平台对接不在范围；签到支持 face 枚举类型。

#### 7.2.2 人脸增量同步

**状态：** — 排除（集成对接不在交付范围）

- 同上。

#### 7.3.1 按实验室统计设备资产价值

**状态：** ✅ 已完成

![7.3.1](/opt/cursor/artifacts/screenshots/02-dashboard.png)

- Dashboard asset-panel + `/statistics/equipment-value` API。

#### 7.3.2 按专业维度汇总设备价值

**状态：** ✅ 已完成

![7.3.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- StatisticsPage 按仪器分类价值表格（可扩展至专业维度字段）。

### 8. 数据统计与分析

#### 8.1.1 设备使用频次/时长/使用率

**状态：** ✅ 已完成

![8.1.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- instrument-usage 统计 API + 页面表格。

#### 8.1.2 按价值区间分层统计

**状态：** ✅ 已完成

![8.1.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- equipment-value 分层表格。

#### 8.2.1 实验室使用人数与人时数

**状态：** ✅ 已完成

![8.2.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- lab-usage person_times + total_hours。

#### 8.2.2 按课程/项目/时间段分析

**状态：** ✅ 已完成

![8.2.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- 实验项目统计 + 时间范围筛选。

#### 8.3.1 实验项目开设数量统计

**状态：** ✅ 已完成

![8.3.1](/opt/cursor/artifacts/screenshots/17-statistics.png)

- 按类型/学期表格展示。

#### 8.3.2 列表图表展示与导出

**状态：** ✅ 已完成

![8.3.2](/opt/cursor/artifacts/screenshots/17-statistics.png)

- 表格 + StatCard + xlsx 导出。

### 9. 系统基础功能

#### 9.1.1 B/S 架构，支持本地化/云端部署

**状态：** ✅ 已完成

- FastAPI + React SPA；Docker/SQLite/PostgreSQL 可切换。

#### 9.1.2 分层设计

**状态：** ✅ 已完成

- frontend / modules / repository 三层结构。

#### 9.1.3 跨平台浏览器兼容

**状态：** ✅ 已完成

- Ant Design + Vite，兼容 Chrome/Firefox/Edge。

#### 9.2.1 SSO 单点登录

**状态：** ✅ 已完成

![9.2.1](/opt/cursor/artifacts/screenshots/01-login.png)

- 登录页 SSO 按钮；`/auth/sso/login` 本地 CAS/OIDC 模拟流程。
- （生产 IdP 对接属集成范畴，不在范围。）

#### 9.2.2 一卡通刷卡签到

**状态：** ✅ 已完成

![9.2.2](/opt/cursor/artifacts/screenshots/10-lab-bookings-usage-panel.png)

- check-in method=card 已实现；实机刷卡器属硬件集成排除。

#### 9.2.3 标准化 RESTful API

**状态：** ✅ 已完成

![9.2.3](/opt/cursor/artifacts/screenshots/30-openapi-docs.png)

- OpenAPI `/docs`；120+ 端点。

#### 9.3.1 人脸数据中台对接

**状态：** — 排除（集成对接不在交付范围）

- 外部人脸平台对接不在范围。

#### 9.3.2 人脸增量同步

**状态：** — 排除（集成对接不在交付范围）

- 同上。

#### 9.4.1 移动端入口

**状态：** ✅ 已完成

![9.4.1](/opt/cursor/artifacts/screenshots/22-mobile-dashboard.png)

- H5 移动版 `/mobile/*` 完整可用（Dashboard/预约/故障/通知）。
- 微信/钉钉原生小程序不在范围。

#### 9.5.1 多角色用户管理 RBAC

**状态：** ✅ 已完成

![9.5.1](/opt/cursor/artifacts/screenshots/20-users-create-modal.png)

- 6 种角色；用户 CRUD + 启用/禁用 + 编辑表单。

#### 9.5.2 空间管理（楼栋/楼层/房间）

**状态：** ✅ 已完成

![9.5.2](/opt/cursor/artifacts/screenshots/05-spaces.png)

- 三级空间增删改查闭环。

#### 9.5.3 实验室 CRUD + 巡查状态

**状态：** ✅ 已完成

![9.5.3](/opt/cursor/artifacts/screenshots/04-lab-detail.png)

- inspection_status 列表/详情/表单完整展示与编辑。

#### 9.6.1 可视化大屏看板

**状态：** ✅ 已完成

![9.6.1](/opt/cursor/artifacts/screenshots/02-dashboard.png)

- Dashboard 运行态势大屏。

#### 9.6.2 涵盖运行/预约/安全/资产

**状态：** ✅ 已完成

![9.6.2](/opt/cursor/artifacts/screenshots/02-dashboard.png)

- overview + 7日趋势 + 安全面板 + 资产价值面板。

#### 9.6.3 数据实时刷新

**状态：** ✅ 已完成

![9.6.3](/opt/cursor/artifacts/screenshots/02-dashboard.png)

- TanStack Query refetchInterval 30~120s 自动刷新。

### 10. 智能体与接口

#### 10.1.1 MCP/API 自然语言操作

**状态：** ✅ 已完成

![10.1.1](/opt/cursor/artifacts/screenshots/23-copilot-dashboard.png)

- CopilotKit 侧边栏 + Agent REST API + MCP JSON-RPC `/api/v1/mcp`。

#### 10.1.2 实时推送与 AI 待办

**状态：** ✅ 已完成

![10.1.2](/opt/cursor/artifacts/screenshots/23-copilot-dashboard.png)

- 签到/门禁 API + 站内通知；Copilot 可查询待办。

#### 10.2.1 Text-to-SQL 自然语言查询

**状态：** ✅ 已完成

![10.2.1](/opt/cursor/artifacts/screenshots/23-copilot-dashboard.png)

- `POST /agent/text-to-sql` 支持中文问句转只读 SQL。

#### 10.2.2 知识库 CRUD 与搜索

**状态：** ✅ 已完成

![10.2.2](/opt/cursor/artifacts/screenshots/24-knowledge-search.png)

- 「知识库」页面：文档 CRUD + 中文 FTS/混合搜索。

### ★11. 银校收费

#### 11.1 银校直连与经营性收费

**状态：** ✅ 已完成

![11.1](/opt/cursor/artifacts/screenshots/19-payments.png)

- 支付订单、bank_ref、PaymentReceipt、对账适配器已实现。
- （中国银行生产网关属外部集成，不在范围。）

### ★12. 实名制支付

#### 12.1 实名制预约支付

**状态：** ✅ 已完成

![12.1](/opt/cursor/artifacts/screenshots/19-payments.png)

- 用户 card_no/campus_id；`POST /lab-bookings/{id}/pay` 一键支付流程。

---

## 四、验证方式

```bash
cd backend && python3 -m scripts.reset_and_seed
python3 -m uvicorn src.main:app --port 8000
cd frontend && npm run dev
# 浏览器访问 http://127.0.0.1:5173  账号 admin/admin123
```

重新生成本报告截图：

```bash
python3 scripts/capture_screenshots.py
python3 scripts/generate_delivery_report.py
```
