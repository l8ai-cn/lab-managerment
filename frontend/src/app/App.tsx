import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, Layout, Menu, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ExperimentDetail } from "@/features/experiments/components/ExperimentDetail";
import { ExperimentForm } from "@/features/experiments/components/ExperimentForm";
import { ExperimentList } from "@/features/experiments/components/ExperimentList";

const queryClient = new QueryClient();

const { Header, Content, Sider } = Layout;

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { key: "/experiments", label: "实验管理" },
  ];

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key ?? "/experiments";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", color: "#fff", fontSize: 18 }}>
        实验室管理系统
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
            <Route path="/experiments" element={<ExperimentList />} />
            <Route path="/experiments/new" element={<ExperimentForm />} />
            <Route path="/experiments/:id" element={<ExperimentDetail />} />
            <Route path="*" element={<Navigate to="/experiments" replace />} />
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
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
