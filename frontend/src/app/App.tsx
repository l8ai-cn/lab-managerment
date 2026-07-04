import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button, ConfigProvider, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { LoginPage } from "@/app/LoginPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { DataReportingPage } from "@/features/data-reporting/components/DataReportingPage";
import { ExperimentDetail } from "@/features/experiments/components/ExperimentDetail";
import { ExperimentForm } from "@/features/experiments/components/ExperimentForm";
import { ExperimentList } from "@/features/experiments/components/ExperimentList";
import {
  ProjectEditPage,
  ProjectFormPage,
} from "@/features/experiment-projects/components/ProjectForm";
import { ProjectList } from "@/features/experiment-projects/components/ProjectList";
import { FaultDetail } from "@/features/faults/components/FaultDetail";
import { FaultList } from "@/features/faults/components/FaultList";
import { InstrumentBookingList } from "@/features/instruments/components/InstrumentBookingList";
import { InstrumentList } from "@/features/instruments/components/InstrumentList";
import { IntegrationPage } from "@/features/integrations/components/IntegrationPage";
import { LabBookingList } from "@/features/lab-bookings/components/LabBookingList";
import { LabChangeDetail } from "@/features/lab-changes/components/LabChangeDetail";
import { LabChangeList } from "@/features/lab-changes/components/LabChangeList";
import { LabStaffList } from "@/features/lab-staff/components/LabStaffList";
import { LabDetail } from "@/features/labs/components/LabDetail";
import { LabForm } from "@/features/labs/components/LabForm";
import { LabList } from "@/features/labs/components/LabList";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { PaymentOrderList } from "@/features/payments/components/PaymentOrderList";
import { StatisticsPage } from "@/features/statistics/components/StatisticsPage";
import { AuthProvider, useAuth } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";

const queryClient = new QueryClient();

const { Header, Content, Sider } = Layout;

const MENU_ITEMS: MenuProps["items"] = [
  {
    type: "group",
    label: "实验室管理",
    children: [
      { key: "/labs", label: "实验室" },
      { key: "/lab-staff", label: "实验员" },
      { key: "/lab-changes", label: "变更管理" },
    ],
  },
  {
    type: "group",
    label: "设备与预约",
    children: [
      { key: "/instruments", label: "仪器台账" },
      { key: "/instrument-bookings", label: "仪器预约" },
      { key: "/lab-bookings", label: "实验室预约" },
    ],
  },
  {
    type: "group",
    label: "教学科研",
    children: [
      { key: "/experiment-projects", label: "实验项目" },
      { key: "/experiments", label: "科研实验" },
    ],
  },
  {
    type: "group",
    label: "运维管理",
    children: [
      { key: "/faults", label: "故障上报" },
      { key: "/data-reporting", label: "数据填报" },
    ],
  },
  {
    type: "group",
    label: "系统",
    children: [
      { key: "/statistics", label: "统计分析" },
      { key: "/dashboard", label: "可视化大屏" },
      { key: "/integrations", label: "系统对接" },
      { key: "/payments", label: "收费管理" },
    ],
  },
];

const ROUTE_KEYS = MENU_ITEMS.flatMap((group) =>
  "children" in (group ?? {}) ? (group as { children: { key: string }[] }).children.map((c) => c.key) : [],
);

function findSelectedKey(pathname: string): string {
  const match = ROUTE_KEYS.find((key) => pathname === key || pathname.startsWith(`${key}/`));
  return match ?? "/dashboard";
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const selectedKey = findSelectedKey(location.pathname);
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fff",
          fontSize: 18,
        }}
      >
        <span>实验室管理系统</span>
        <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 16 }}>
          <NotificationBell />
          {user?.name}
          <Button type="link" style={{ color: "#fff" }} onClick={logout}>
            退出
          </Button>
        </span>
      </Header>
      <Layout>
        <Sider width={200}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            onClick={({ key }) => navigate(key)}
            style={{ height: "100%" }}
          />
        </Sider>
        <Content style={{ padding: isDashboard ? 0 : 24 }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/labs" element={<LabList />} />
            <Route path="/labs/new" element={<LabForm />} />
            <Route path="/labs/:id" element={<LabDetail />} />
            <Route path="/lab-staff" element={<LabStaffList />} />
            <Route path="/lab-changes" element={<LabChangeList />} />
            <Route path="/lab-changes/:id" element={<LabChangeDetail />} />
            <Route path="/instruments" element={<InstrumentList />} />
            <Route path="/instrument-bookings" element={<InstrumentBookingList />} />
            <Route path="/lab-bookings" element={<LabBookingList />} />
            <Route path="/experiment-projects" element={<ProjectList />} />
            <Route path="/experiment-projects/new" element={<ProjectFormPage />} />
            <Route path="/experiment-projects/:id/edit" element={<ProjectEditPage />} />
            <Route path="/experiments" element={<ExperimentList />} />
            <Route path="/experiments/new" element={<ExperimentForm />} />
            <Route path="/experiments/:id" element={<ExperimentDetail />} />
            <Route path="/faults" element={<FaultList />} />
            <Route path="/faults/:id" element={<FaultDetail />} />
            <Route path="/data-reporting" element={<DataReportingPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/integrations" element={<IntegrationPage />} />
            <Route path="/payments" element={<PaymentOrderList />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
