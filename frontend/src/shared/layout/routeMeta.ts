export interface RouteMeta {
  title: string;
  group?: string;
  subtitle?: string;
}

const ROUTE_META_MAP: Record<string, RouteMeta> = {
  "/dashboard": { title: "可视化大屏", group: "系统", subtitle: "实验室运行态势大屏监控中心" },
  "/labs": { title: "实验室", group: "实验室管理", subtitle: "实验分室基本台账与管理" },
  "/spaces": { title: "空间管理", group: "实验室管理", subtitle: "楼宇楼层与实验室房间物理层级" },
  "/lab-staff": { title: "实验员", group: "实验室管理", subtitle: "实验室负责技术员绑定配置" },
  "/lab-changes": { title: "变更管理", group: "实验室管理", subtitle: "实验分室扩建、负责人及设备变更审批" },
  "/instruments": { title: "仪器台账", group: "设备与预约", subtitle: "贵重精密设备资产卡片台账" },
  "/instrument-bookings": { title: "仪器预约", group: "设备与预约", subtitle: "精密设备预约预定日历" },
  "/instruments/rules": { title: "仪器规则", group: "设备与预约", subtitle: "差别化预约准入限制" },
  "/lab-bookings": { title: "实验室预约", group: "设备与预约", subtitle: "实验分室时段占用预约" },
  "/lab-bookings/rules": { title: "实验室规则", group: "设备与预约", subtitle: "排课排考准入规则配置" },
  "/lab-bookings/usage-approval": { title: "使用记录审核", group: "设备与预约", subtitle: "现场扫码签到使用实绩二次核验" },
  "/courses": { title: "课程管理", group: "教学科研", subtitle: "教务班级与教学大纲绑定" },
  "/experiment-projects": { title: "实验项目", group: "教学科研", subtitle: "实验课时、实验类型、大纲指标" },
  "/experiments": { title: "科研实验", group: "教学科研", subtitle: "教师/研究生高阶科研实验八态追踪" },
  "/faults": { title: "故障上报", group: "运维管理", subtitle: "快速扫描二维码故障登记与处理" },
  "/data-reporting": { title: "数据填报", group: "运维管理", subtitle: "教育部基表标准化在线提报" },
  "/knowledge": { title: "知识库", group: "运维管理", subtitle: "设备说明书、故障库、操作指引检索" },
  "/statistics": { title: "统计分析", group: "系统", subtitle: "使用工时、人时数多维度报表" },
  "/integrations": { title: "系统对接", group: "系统", subtitle: "资产、一卡通、人脸、数据中台适配器" },
  "/class-boards": { title: "电子班牌", group: "系统", subtitle: "实验分室外侧电子屏幕态势" },
  "/users": { title: "用户管理", group: "系统", subtitle: "多角色 RBAC 授权管理" },
  "/payments": { title: "收费管理", group: "系统", subtitle: "仪器经营收费订单及流水" },
  "/mobile/dashboard": { title: "移动端", group: "系统", subtitle: "手机快捷端登录入口" },
};

export function getRouteMeta(pathname: string): RouteMeta {
  const match = Object.keys(ROUTE_META_MAP).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return ROUTE_META_MAP[match ?? ""] ?? { title: "系统后台", group: "LabOS" };
}
