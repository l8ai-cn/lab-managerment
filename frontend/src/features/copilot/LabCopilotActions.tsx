import { useFrontendTool, useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/shared/auth/AuthContext";
import { getRouteMeta } from "@/shared/layout/routeMeta";

const NAVIGABLE_ROUTES = [
  "/dashboard",
  "/labs",
  "/spaces",
  "/users",
  "/lab-staff",
  "/lab-changes",
  "/instruments",
  "/instruments/rules",
  "/instrument-bookings",
  "/lab-bookings",
  "/lab-bookings/rules",
  "/courses",
  "/experiment-projects",
  "/experiments",
  "/faults",
  "/fault-report",
  "/data-reporting",
  "/statistics",
  "/integrations",
  "/payments",
  "/mobile/dashboard",
] as const;

export function LabCopilotActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pageMeta = getRouteMeta(location.pathname);

  const pageContext = useMemo(
    () => ({
      pathname: location.pathname,
      pageTitle: pageMeta.title,
      pageGroup: pageMeta.group ?? null,
      user: user
        ? {
            name: user.name,
            role: user.role,
          }
        : null,
    }),
    [location.pathname, pageMeta.group, pageMeta.title, user],
  );

  useAgentContext({
    description: "当前页面与用户上下文",
    value: pageContext,
  });

  useFrontendTool({
    name: "navigate_to_page",
    description: "跳转到平台指定功能页面",
    parameters: z.object({
      path: z.enum(NAVIGABLE_ROUTES),
    }),
    handler: async ({ path }) => {
      navigate(path);
      const meta = getRouteMeta(path);
      return `已跳转到 ${meta.title}（${path}）`;
    },
  });

  useFrontendTool({
    name: "open_fault_report",
    description: "打开故障上报页面，可选指定实验室ID",
    parameters: z.object({
      lab_id: z.string().optional(),
    }),
    handler: async ({ lab_id }) => {
      const path = lab_id ? `/fault-report?lab_id=${lab_id}` : "/fault-report";
      navigate(path);
      return lab_id ? `已打开实验室 ${lab_id} 的故障上报页` : "已打开故障上报页";
    },
  });

  useFrontendTool({
    name: "open_booking_rules",
    description: "打开实验室或仪器预约规则配置页",
    parameters: z.object({
      type: z.enum(["lab", "instrument"]),
    }),
    handler: async ({ type }) => {
      const path = type === "lab" ? "/lab-bookings/rules" : "/instruments/rules";
      navigate(path);
      return `已打开${type === "lab" ? "实验室" : "仪器"}预约规则页`;
    },
  });

  return null;
}
