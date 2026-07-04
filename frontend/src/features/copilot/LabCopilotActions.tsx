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
  "/instrument-bookings",
  "/lab-bookings",
  "/experiment-projects",
  "/experiments",
  "/faults",
  "/data-reporting",
  "/statistics",
  "/integrations",
  "/payments",
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

  return null;
}
