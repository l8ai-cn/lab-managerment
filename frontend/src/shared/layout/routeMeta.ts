export interface RouteMeta {
  title: string;
  subtitle?: string;
  group?: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  "/dashboard": { title: "可视化大屏", subtitle: "实验室运行态势实时监测", group: "系统" },
  "/labs": { title: "实验室管理", subtitle: "实验室基本信息与状态维护", group: "实验室管理" },
  "/labs/new": { title: "新建实验室", group: "实验室管理" },
  "/lab-staff": { title: "实验员管理", subtitle: "实验员信息与实验室绑定", group: "实验室管理" },
  "/lab-changes": { title: "变更管理", subtitle: "实验室信息变更申请与审批", group: "实验室管理" },
  "/instruments": { title: "仪器台账", subtitle: "仪器设备资产与状态管理", group: "设备与预约" },
  "/instrument-bookings": { title: "仪器预约", subtitle: "仪器在线预约与审批", group: "设备与预约" },
  "/lab-bookings": { title: "实验室预约", subtitle: "实验室时段预约与签到", group: "设备与预约" },
  "/experiment-projects": { title: "实验项目", subtitle: "课程实验项目维护", group: "教学科研" },
  "/experiments": { title: "科研实验", subtitle: "科研实验全生命周期管理", group: "教学科研" },
  "/faults": { title: "故障上报", subtitle: "设备与环境问题上报处理", group: "运维管理" },
  "/data-reporting": { title: "数据填报", subtitle: "教育部基表标准化填报", group: "运维管理" },
  "/statistics": { title: "统计分析", subtitle: "使用率与人时数多维分析", group: "系统" },
  "/integrations": { title: "系统对接", subtitle: "外部系统数据同步", group: "系统" },
  "/payments": { title: "收费管理", subtitle: "实验室使用费用与支付", group: "系统" },
};

export function getRouteMeta(pathname: string): RouteMeta {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];

  // 动态路由匹配
  if (pathname.match(/^\/labs\/[^/]+$/)) {
    return { title: "实验室详情", group: "实验室管理" };
  }
  if (pathname.match(/^\/lab-changes\/[^/]+$/)) {
    return { title: "变更详情", group: "实验室管理" };
  }
  if (pathname.match(/^\/faults\/[^/]+$/)) {
    return { title: "故障详情", group: "运维管理" };
  }
  if (pathname.startsWith("/experiment-projects/new")) {
    return { title: "新建实验项目", group: "教学科研" };
  }
  if (pathname.match(/^\/experiment-projects\/[^/]+\/edit$/)) {
    return { title: "编辑实验项目", group: "教学科研" };
  }
  if (pathname.match(/^\/experiments\/[^/]+$/)) {
    return { title: "实验详情", group: "教学科研" };
  }

  return { title: "实验室管理系统" };
}
