import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button, ConfigProvider, Layout, Menu, theme } from "antd";
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
import { LabChangeDetail } from "@/features/lab-changes/components/LabChangeDetail";
import { LabChangeList } from "@/features/lab-changes/components/LabChangeList";
import { LabStaffList } from "@/features/lab-staff/components/LabStaffList";
import { ExperimentDetail } from "@/features/experiments/components/ExperimentDetail";
import { ExperimentForm } from "@/features/experiments/components/ExperimentForm";
import { ExperimentList } from "@/features/experiments/components/ExperimentList";
import { LabDetail } from "@/features/labs/components/LabDetail";
import { LabForm } from "@/features/labs/components/LabForm";
import { LabList } from "@/features/labs/components/LabList";
import { AuthProvider, useAuth } from "@/shared/auth/AuthContext";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";

const queryClient = new QueryClient();

const { Header, Content, Sider } = Layout;

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: "/labs", label: "实验室管理" },
    { key: "/lab-staff", label: "实验员管理" },
    { key: "/lab-changes", label: "变更管理" },
    { key: "/experiments", label: "科研实验" },
  ];

  const selectedKey =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key ?? "/labs";

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
        <span style={{ fontSize: 14 }}>
          {user?.name}
          <Button type="link" style={{ color: "#fff", marginLeft: 8 }} onClick={logout}>
            退出
          </Button>
        </span>
      </Header>
      <Layout>
        <Sider width={200}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: "100%" }}
          />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/labs" element={<LabList />} />
            <Route path="/labs/new" element={<LabForm />} />
            <Route path="/labs/:id" element={<LabDetail />} />
            <Route path="/lab-staff" element={<LabStaffList />} />
            <Route path="/lab-changes" element={<LabChangeList />} />
            <Route path="/lab-changes/:id" element={<LabChangeDetail />} />
            <Route path="/experiments" element={<ExperimentList />} />
            <Route path="/experiments/new" element={<ExperimentForm />} />
            <Route path="/experiments/:id" element={<ExperimentDetail />} />
            <Route path="*" element={<Navigate to="/labs" replace />} />
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
