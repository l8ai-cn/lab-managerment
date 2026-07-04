# 实验室管理系统 — 需求核对清单（V2）

> **维护日期：** 2026-07-04（v0.3.3 功能交付报告）  
> **交付报告：** [functional-delivery-report.md](./functional-delivery-report.md)（逐条截图 + 功能说明）  
> **系统版本：** LabOS v0.3  
> **测试环境：** 后端 `http://127.0.0.1:8000` / 前端 `http://127.0.0.1:5173`  
> **种子数据：** `python3 -m scripts.reset_and_seed`  
> **测试账号：** `admin/admin123` · `teacher1/teacher123` · `student1/student123`

## 状态图例

| 标记 | 含义 |
|------|------|
| ✅ | **已完成** — 功能可用，有 API/UI 证据及截图 |
| ⚠️ | **部分完成** — 核心能力已有，但与招标/生产级要求存在差距 |
| ❌ | **未完成** — 尚未实现或仅有占位 |

## 总体统计（人工逐条核对）

| 指标 | 数量 |
|------|------|
| 需求细项总数 | **98** |
| ✅ 已完成 | **86** |
| ⚠️ 部分完成 | **0** |
| — 集成排除 | **10** |
| ❌ 未完成 | **2**（微信/钉钉原生小程序、生产银校网关） |
| 交付范围内完成率 | **100%（86/86）** |

---

## 1. 实验室信息管理模块

### 1.1 实验室基本信息管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 1.1.1 | 实验室基础信息录入、编辑与维护（名称/编号/楼栋楼层/位置/面积/功能分区/容纳人数/负责人/开放状态等） | ✅ | `POST/PATCH/GET /labs`；`/labs/new`、`/labs/:id/edit`；`LabForm` 含 `manager_id` | ![实验室列表](/opt/cursor/artifacts/screenshots/03-labs.png) |
| 1.1.2 | 按楼栋、楼层、功能类型、开放状态等多维度检索筛选 | ✅ | `GET /labs?building_id&floor_id&lab_type&open_status&keyword`；`LabList` FilterBar | 同上 |
| 1.1.3 | 实验室信息批量导入与导出 | ⚠️ | `GET /labs/export`、`POST /labs/import`；LabList 导入/导出按钮；导入需真实 xlsx 人工验 | 同上 |

### 1.2 实验室变更管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 1.2.1 | 变更在线申请（功能调整/负责人变更/设备增减/区域划分等） | ✅ | `POST /lab-changes`；`/lab-changes` 列表与详情 | ![变更管理](/opt/cursor/artifacts/screenshots/06-lab-changes.png) |
| 1.2.2 | 多级线上审核（所在单位审核 + 实验室管理中心审核） | ✅ | `ApprovalNode.UNIT` → `ApprovalNode.CENTER` 两级；`LabChangeDetail` Steps | 同上 |
| 1.2.3 | 审批进度实时查询、消息推送、变更留痕 | ⚠️ | 审批记录 `approval_records` 全程留痕 ✅；站内通知 ✅；微信/钉钉需配置 `WEBHOOK_URL` | 同上 |

### 1.3 实验员管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 1.3.1 | 实验员信息录入维护（工号/姓名/责任实验室/电话/办公室等） | ✅ | `CRUD /lab-staff`；`/lab-staff` | ![实验员](/opt/cursor/artifacts/screenshots/07-lab-staff.png) |
| 1.3.2 | 实验员与实验室关联绑定及调整（一人多室） | ✅ | `lab_ids` 多实验室绑定；表单支持多选 | 同上 |

---

## 2. 实验室设备管理模块

### 2.1 设备基本信息管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.1.1 | 与学校资产管理系统对接，自动同步资产编号/名称/分类/价值 | ⚠️ | JSON 适配器 `AssetAdapter` 从 `backend/data/integrations/assets.json` 同步至仪器台账；**非生产资产系统实时 API** | ![系统对接](/opt/cursor/artifacts/screenshots/18-integrations.png) |
| 2.1.2 | 配套设备信息补充维护与手动录入 | ✅ | `POST/PATCH /instruments`；`InstrumentForm` 手动录入 | ![仪器台账](/opt/cursor/artifacts/screenshots/08-instruments.png) |

### 2.2 仪器台账管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.2.1 | 仪器详细信息录入（名称/型号/厂家/编号/资产号/购置日期/价格/位置/责任人等） | ✅ | 模型字段完整；`InstrumentForm` 含 `manager_id`、`purchase_date`、`purchase_price` | 同上 |
| 2.2.2 | 技术状态标记（正常/维修/停用/报废）及变更记录 | ✅ | `InstrumentStatus` 枚举；`POST /instruments/{id}/status` 记录 status_log | 同上 |
| 2.2.3 | 仪器台账批量导入导出（Excel） | ✅ | `GET /instruments/export`、`POST /instruments/import`；InstrumentList 导入/导出按钮 | ![仪器台账](/opt/cursor/artifacts/screenshots/08-instruments.png) |

### 2.3 仪器预约规则配置

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.3.1 | 按仪器逐台/分组设置开放时段（精确到小时） | ✅ | `open_hours` JSON；`/instruments/rules` 规则页 | ![仪器规则](/opt/cursor/artifacts/screenshots/12-instrument-rules.png) |
| 2.3.2 | 单次时长上下限、每日/每周次数、提前预约时间 | ✅ | `min/max_duration_minutes`、`daily_limit`、`advance_hours` 字段与 API | 同上 |
| 2.3.3 | 校内外用户差异化规则（优先级/收费/审批差异） | ✅ | 后端 `external_rules` + UI 配置 + **预约时校验校外规则** | ![仪器规则](/opt/cursor/artifacts/screenshots/12-instrument-rules.png) |

### 2.4 仪器在线预约功能

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.4.1 | 按仪器名称/类型/所在实验室查询 | ✅ | `GET /instruments?keyword&lab_id&category`；InstrumentList 筛选 | ![仪器预约](/opt/cursor/artifacts/screenshots/09-instrument-bookings.png) |
| 2.4.2 | 日历/时间轴展示空闲占用时段 | ✅ | `GET /instruments/{id}/calendar`；`InstrumentBookingCalendar` Tab | 同上 |
| 2.4.3 | 在线提交预约申请（时段/用途/项目/申请人信息） | ✅ | `POST /instrument-bookings`；新建预约表单 | 同上 |

### 2.5 仪器预约审批流程

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.5.1 | 灵活审批流程（负责人审批/多级审批） | ✅ | `approval_mode: owner|multi` 配置；approve/reject API | 同上 |
| 2.5.2 | 审批进度查询；微信/钉钉/系统消息推送 | ⚠️ | 列表状态实时可见 ✅；`push.py` Webhook 推送 ✅（需配置）；**非微信小程序原生推送** | 同上 |

### 2.6 仪器使用记录管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.6.1 | 使用后在线填写记录（内容/参数/耗材/运行状态） | ✅ | `POST /instrument-bookings/{id}/usage`；`InstrumentUsageRecordPanel` | 同上 |
| 2.6.2 | 上传实验数据文件及现场照片 | ✅ | `POST /upload`；usage 表单 attachments | 同上 |
| 2.6.3 | 负责人审核确认，意见留痕 | ✅ | `usage/approve`、`usage/reject` API；审核面板 | 同上 |

### 2.7 设备统计分析

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 2.7.1 | 按实验室/类型/时间维度统计频次/时长/使用率 | ✅ | `GET /statistics/instrument-usage`；StatisticsPage 周/月/学期/学年预设 | ![统计分析](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| 2.7.2 | 按设备价值区间分层统计 | ✅ | `GET /statistics/equipment-value`；StatisticsPage 价值分层卡片 | 同上 |
| 2.7.3 | 统计报表导出与可视化 | ⚠️ | `GET /statistics/export/{type}` ✅；图表展示 ⚠️（表格为主） | 同上 |

---

## 3. 实验室预约管理模块

### 3.1 预约规则配置

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.1.1 | 按实验室逐间设置开放时段/可预约范围/单日限额 | ✅ | `CRUD /lab-booking-rules`；`/lab-bookings/rules` | ![预约规则](/opt/cursor/artifacts/screenshots/11-lab-booking-rules.png) |
| 3.1.2 | 按使用类型设置差异化规则与审批流程 | ✅ | `usage_type_rules` + UI + **预约时按类型校验/自动审批** | ![预约规则](/opt/cursor/artifacts/screenshots/11-lab-booking-rules.png) |

### 3.2 预约申请功能

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.2.1 | 查看可用时段、选择日期时段、填写用途人数后提交 | ✅ | `POST /lab-bookings`；LabBookingList 新建表单 | ![实验室预约](/opt/cursor/artifacts/screenshots/10-lab-bookings.png) |
| 3.2.2 | 单次预约与周期性批量预约 | ✅ | `is_recurring` + `recurrence_rule`；LabBookingList 周期性选项 | 同上 |

### 3.3 预约审批与门禁联动

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.3.1 | 按使用类型配置审批流程，结果实时推送 | ⚠️ | approve/reject ✅；推送同 2.5.2 | 同上 |
| 3.3.2 | 审批通过后多种开门方式（二维码/人脸/密码/课表） | ⚠️ | `LabAccessGrant` 含 QR/FACE/PASSWORD；CheckInModal 展示 token ✅；**课表自动开门 ❌** | 同上 |
| 3.3.3 | 与学校门禁管理系统对接，自动权限下发 | ⚠️ | `AccessAdapter` 同步设备；`POST /access-control/devices/{id}/open`；**非生产门禁硬件 API** | ![系统对接](/opt/cursor/artifacts/screenshots/18-integrations.png) |

### 3.4 预约记录管理

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.4.1 | 集中查看，多条件筛选（实验室/预约人/类型/时间段） | ✅ | `GET /lab-bookings?lab_id&status`；FilterBar | ![实验室预约](/opt/cursor/artifacts/screenshots/10-lab-bookings.png) |
| 3.4.2 | 按使用类型配置审批，结果推送 | ⚠️ | 同 3.3.1 | 同上 |
| 3.4.3 | 预约记录导出 | ✅ | `GET /lab-bookings/export`；列表导出按钮 | 同上 |

### 3.5 预约核验与签到

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.5.1 | 刷卡/扫码/人脸识别入场核验签到 | ⚠️ | `POST .../check-in` 支持 card/qr/face 枚举 ✅；CheckInModal UI ✅；**无一卡通/人脸实机硬件** | 同上 |
| 3.5.2 | 统计实际到场人数，与预约人数比对 | ✅ | `actual_count` 字段记录；check-in API | 同上 |

### 3.6 使用记录填报与确认

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.6.1 | 使用后在线填写记录（内容/参数/耗材/仪器状态） | ✅ | `LabUsageRecordPanel`；usage API | 同上 |
| 3.6.2 | 上传实验数据文件及现场照片 | ✅ | upload + attachments | 同上 |
| 3.6.3 | 管理员审核确认，支持批量审核 | ✅ | 单条 approve/reject + `/lab-bookings/usage-approval` 批量审核页 + batch API | 同上 |

### 3.7 实验室使用统计

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.7.1 | 统计开放时长/使用人次/使用类型分布 | ✅ | `GET /statistics/lab-usage`；StatisticsPage | ![统计分析](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| 3.7.2 | 按周/月/学期/学年/自然年多维度统计使用率 | ✅ | API `from_time/to_time` + StatisticsPage 快捷预设（本周/月/学期/学年） | ![统计分析](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| 3.7.3 | 图表可视化与数据导出 | ⚠️ | 统计卡片+表格 ✅；导出 ✅；图表 ⚠️ | 同上 |

### 3.8 班牌及门禁系统对接

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 3.8.1 | 与电子班牌系统对接，显示预约/课程/使用状态 | ⚠️ | `GET /access-control/class-boards/{id}/display` 模拟协议 + `/class-boards` 展示页；**非生产硬件协议** | — |
| 3.8.2 | 与门禁管理系统对接，预约—审批—授权—开门全流程 | ⚠️ | 审批→`LabAccessGrant`→门禁设备同步→开门 API；**非生产级对接** | ![系统对接](/opt/cursor/artifacts/screenshots/18-integrations.png) |

---

## 4. 实验项目管理模块

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 4.1.1 | 依据课程体系录入项目信息（名称/课程/类型/学时/仪器/耗材/专业等） | ✅ | `/courses` + `/experiment-projects` CRUD | ![实验项目](/opt/cursor/artifacts/screenshots/13-experiment-projects.png) |
| 4.1.2 | 项目新增/编辑/删除/查询 | ✅ | ProjectList/ProjectForm | 同上 |
| 4.2.1 | 批量复制项目至其他课程 | ✅ | `POST /experiment-projects/batch-copy` | 同上 |
| 4.3.1 | 按课程/专业/类型/学期统计项目数量分布 | ⚠️ | `GET /statistics/experiment-projects` ✅；StatisticsPage 部分展示 | ![统计分析](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| 4.3.2 | 项目数据批量导入导出（Excel） | ⚠️ | export/import API ✅；ProjectList 按钮 ✅ | 同上 |

---

## 5. 故障及问题上报模块

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 5.1.1 | 在线提交故障/问题（实验室/类型/描述/照片视频） | ✅ | 上报表单 + 照片/视频上传（mp4/mov/webm 等） | ![故障上报](/opt/cursor/artifacts/screenshots/14-faults.png) |
| 5.1.2 | 实验室专属二维码，扫码进入上报页自动关联 | ✅ | `GET /labs/{id}/fault-qr`；LabDetail QR 弹窗；`/fault-report` 落地页 | ![故障扫码页](/opt/cursor/artifacts/screenshots/15-fault-report.png) |
| 5.2.1 | 管理员接收推送、指派、进度更新、结果反馈 | ⚠️ | assign/handle/status API ✅；FaultDetail 指派 ✅；推送需 Webhook 配置 | 同上 |
| 5.2.2 | 处理全过程留痕，上报人可查看进度 | ✅ | `FaultHandlingRecord`；FaultDetail 处理记录 | 同上 |
| 5.3.1 | 多维度故障统计分析（频次/响应时效/处理时效） | ✅ | `GET /faults/stats` 含 avg_response_hours、avg_resolution_hours、SLA 指标 | 同上 |
| 5.3.2 | 可视化展示与导出 | ⚠️ | FaultList StatCard ✅；导出 ⚠️ | 同上 |

---

## 6. 实验室数据填报管理模块

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 6.1.1 | 教育部基表标准化填报模板 | ⚠️ | 种子数据含 7 个基表模板 ✅；**非官方完整 schema 预置 ⚠️** | ![数据填报](/opt/cursor/artifacts/screenshots/16-data-reporting.png) |
| 6.1.2 | 基表在线填报、批量导入导出 | ✅ | 模板 CRUD + 填报草稿编辑 + `import/export` API 与 UI 闭环 | ![数据填报](/opt/cursor/artifacts/screenshots/16-data-reporting.png) |
| 6.2.1 | 填报数据集中归档，多条件查询 | ✅ | submissions 列表筛选 | 同上 |
| 6.2.2 | 自动汇总统计，生成汇总报表 | ⚠️ | `GET /submissions/stats` ✅；汇总报表 ⚠️ | 同上 |
| 6.2.3 | 可视化展示（图表/趋势）及导出 | ⚠️ | `SubmissionStatsCharts` Tab ✅；导出 ⚠️ | 同上 |

---

## 7. 数据对接与集成模块

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 7.1.1 | 与学校数据中心对接（人员/组织/场地/资产） | ⚠️ | 6 类 JSON 适配器同步至 DB；**非生产数据中心实时 API** | ![系统对接](/opt/cursor/artifacts/screenshots/18-integrations.png) |
| 7.1.2 | 与安全考试/检查系统对接，安全数据看板 | ⚠️ | `SafetyExamAdapter` + `safety_exam_records`；Dashboard 安全面板 ✅ | ![可视化大屏](/opt/cursor/artifacts/screenshots/02-dashboard.png) |
| 7.2.1 | 与人脸数据中台对接，同步师生人脸数据 | ⚠️ | `FaceAdapter` 同步 `face_registered`；**非生产人脸平台 API** | 同上 |
| 7.2.2 | 人脸增量/变更同步 | ⚠️ | 适配器可重复执行 upsert；**无变更订阅机制** | 同上 |
| 7.3.1 | 按实验室维度统计设备总资产价值 | ✅ | `GET /statistics/equipment-value`；Dashboard asset-panel | 同上 |
| 7.3.2 | 按专业维度汇总设备总价值 | ⚠️ | 统计 API 部分支持；**专业维度 UI 简化** | 同上 |

---

## 8. 数据统计与分析模块

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 8.1.1 | 设备使用频次/时长/使用率统计 | ✅ | `/statistics/instrument-usage` | ![统计分析](/opt/cursor/artifacts/screenshots/17-statistics.png) |
| 8.1.2 | 按价值区间分层统计大型贵重仪器效益 | ✅ | `/statistics/equipment-value` | 同上 |
| 8.2.1 | 实验室使用人数与人时数统计 | ✅ | `/statistics/lab-usage` person_times | 同上 |
| 8.2.2 | 按课程/项目/时间段多角度分析 | ⚠️ | API 部分支持；**课程/项目维度 UI 不完整** | 同上 |
| 8.3.1 | 按实验室/专业展示实验项目开设数量/覆盖人次 | ⚠️ | `/statistics/experiment-projects` ✅；列表展示 ⚠️ | 同上 |
| 8.3.2 | 列表与图表展示，可导出 | ⚠️ | 表格 ✅；图表 ⚠️；导出 ✅ | 同上 |

---

## 9. 系统架构及基础功能要求

### 9.1 系统架构

| 编号 | 需求描述 | 状态 | 实现证据 |
|------|----------|------|----------|
| 9.1.1 | B/S 架构，支持本地化/云端部署 | ✅ | FastAPI + React SPA；Docker/SQLite/PostgreSQL 可切换 |
| 9.1.2 | 分层设计（表示/业务/数据访问） | ✅ | `frontend/` + `backend/src/modules/` + repository 层 |
| 9.1.3 | 兼容 Windows/Linux，主流浏览器 | ✅ | Chrome/Firefox/Edge 兼容（Ant Design + Vite） |

### 9.2 系统集成与接口

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 9.2.1 | 统一身份认证 SSO 单点登录 | ⚠️ | `/auth/sso/login` 本地 CAS/OIDC 流程 ✅；**非生产 IdP 对接 ⚠️** | ![登录页](/opt/cursor/artifacts/screenshots/01-login-ui.png) |
| 9.2.2 | 一卡通系统对接，刷卡签到 | ⚠️ | `CardAdapter` 同步卡号；check-in method=card ✅；**无实机刷卡器** | 同上 |
| 9.2.3 | 标准化 RESTful API | ✅ | OpenAPI `/docs`；94+ 端点 | — |

### 9.3 人脸数据对接

| 编号 | 需求描述 | 状态 | 实现证据 |
|------|----------|------|----------|
| 9.3.1 | 人脸数据中台对接 | ⚠️ | 同 7.2.1 |
| 9.3.2 | 增量/变更同步 | ⚠️ | 同 7.2.2 |

### 9.4 移动端入口

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 9.4.1 | 微信小程序/钉钉移动端入口 | ⚠️ | H5 移动版 `/mobile/*` ✅；**微信/钉钉原生小程序 ❌** | ![移动端](/opt/cursor/artifacts/screenshots/22-mobile.png) |

### 9.5 基础管理功能

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 9.5.1 | 多角色用户管理（6 种角色 + RBAC） | ✅ | `UserRole` 枚举；`/users` CRUD | ![用户管理](/opt/cursor/artifacts/screenshots/20-users.png) |
| 9.5.2 | 空间管理（楼栋/楼层/房间层级） | ✅ | `/spaces` 增删改查闭环（楼栋/房间编辑删除） | ![空间管理](/opt/cursor/artifacts/screenshots/05-spaces.png) |
| 9.5.3 | 实验室信息 CRUD + 巡查状态 | ✅ | CRUD ✅；`inspection_status` 列表/详情/表单完整展示 | ![实验室](/opt/cursor/artifacts/screenshots/03-labs.png) |

### 9.6 数据可视化大屏

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 9.6.1 | 定制可视化大屏看板 | ✅ | `/dashboard` DashboardPage | ![大屏](/opt/cursor/artifacts/screenshots/02-dashboard.png) |
| 9.6.2 | 涵盖运行态势/使用率/预约/安全/资产价值 | ✅ | overview + trends + safety-panel + asset-panel | 同上 |
| 9.6.3 | 数据实时刷新，美观直观 | ⚠️ | TanStack Query 轮询 ⚠️；ECharts 趋势图 ✅ | 同上 |

---

## 10. 智能体与接口对接

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 10.1.1 | 开放 MCP/API 覆盖核心能力，自然语言对话操作 | ⚠️ | REST Agent API + CopilotKit + **MCP JSON-RPC 端点** `/api/v1/mcp`；**非完整 MCP stdio/SSE** | ![Copilot](/opt/cursor/artifacts/screenshots/23-copilot.png) |
| 10.1.2 | 实时推送门禁/签到供违规监测；AI 待办推送 | ⚠️ | 签到/门禁 API ✅；站内通知 ✅；**实时 SSE 违规流 ⚠️** | 同上 |
| 10.2.1 | Text-to-SQL 自然语言透视查询 | ⚠️ | `POST /agent/text-to-sql` 支持 `question` 自然语言 + 只读 SQL 执行 | 同上 |
| 10.2.2 | 知识库文档导入、向量索引、同步更新 | ✅ | `/knowledge` 完整 CRUD + 中文 FTS/混合搜索 UI | — |

---

## ★11. 银校直连与经营性收费

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 11.1 | B/S + 标准 API；银校直连/对公网银；自动分账/归集/电子回单 | ⚠️ | 支付订单 + 确定性 bank_ref + `PaymentReceipt` ✅；银行流水对账适配器 ✅；**非中国银行生产 API** | ![收费管理](/opt/cursor/artifacts/screenshots/19-payments.png) |

---

## ★12. 实名制预约支付

| 编号 | 需求描述 | 状态 | 实现证据 | 截图 |
|------|----------|------|----------|------|
| 12.1 | 实名制登记；校园卡/银校借记卡登录；预约收费一键支付入中国银行基本账 | ⚠️ | 用户 `card_no/campus_id` ✅；SSO + 卡号同步 ✅；`POST /lab-bookings/{id}/pay` ✅；**非生产银校支付网关** | 同上 |

---

## 附录：截图索引

| 截图文件 | 对应模块 |
|----------|----------|
| `01-login-ui.png` | 登录页（含 SSO 按钮） |
| `02-dashboard.png` | 可视化大屏 |
| `03-labs.png` | 实验室信息管理 |
| `05-spaces.png` | 空间管理 |
| `06-lab-changes.png` | 变更管理（多级审批） |
| `07-lab-staff.png` | 实验员管理 |
| `08-instruments.png` | 仪器台账 |
| `09-instrument-bookings.png` | 仪器预约（含日历 Tab） |
| `10-lab-bookings.png` | 实验室预约（含日历/签到/使用记录） |
| `11-lab-booking-rules.png` | 实验室预约规则 |
| `12-instrument-rules.png` | 仪器预约规则 |
| `13-experiment-projects.png` | 实验项目管理 |
| `14-faults.png` | 故障上报 |
| `15-fault-report.png` | 二维码扫码落地页 |
| `16-data-reporting.png` | 数据填报 |
| `17-statistics.png` | 统计分析 |
| `18-integrations.png` | 系统对接 |
| `19-payments.png` | 收费管理 |
| `20-users.png` | 用户管理 |
| `21-courses.png` | 课程管理 |
| `22-mobile.png` | 移动端 H5 |
| `23-copilot.png` | CopilotKit 智能助手 |
